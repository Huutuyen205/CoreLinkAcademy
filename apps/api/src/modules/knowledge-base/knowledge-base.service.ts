import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { findTopKChunks, cosineSimilarity } from '@corelink/ai';

export interface CreateKbDocumentDto {
  title: string;
  category: 'course' | 'fee' | 'schedule' | 'teacher' | 'policy' | 'faq' | 'about';
  content: string;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Tạo tài liệu mới trong kho kiến thức (trạng thái draft) (AI-12, FR-103)
   */
  async createDocument(dto: CreateKbDocumentDto, actorId?: string) {
    const defaultBranch = await this.prisma.branches.findFirst({ where: { is_active: true } });
    if (!defaultBranch) {
      throw new BadRequestException('Chưa có cơ sở hoạt động');
    }

    return this.prisma.kb_documents.create({
      data: {
        branch_id: defaultBranch.id,
        title: dto.title,
        category: dto.category,
        content: dto.content,
        status: 'draft',
      },
    });
  }

  /**
   * Danh sách tài liệu trong kho kiến thức
   */
  async findAllDocuments(status?: 'draft' | 'approved' | 'archived') {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.kb_documents.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { full_name: true } },
        _count: { select: { kb_chunks: true } },
      },
    });
  }

  /**
   * Lấy chi tiết tài liệu kèm danh sách đoạn chunk
   */
  async getDocumentById(id: string) {
    const doc = await this.prisma.kb_documents.findUnique({
      where: { id },
      include: {
        kb_chunks: {
          orderBy: { chunk_index: 'asc' },
        },
        users: { select: { full_name: true } },
      },
    });

    if (!doc) {
      throw new NotFoundException('Không tìm thấy tài liệu kho kiến thức');
    }

    return doc;
  }

  /**
   * Duyệt tài liệu: Tự động phân đoạn (chunking), sinh vector embedding và lưu trữ (AI-12, TC-009)
   */
  async approveDocument(id: string, actorId?: string) {
    const doc = await this.prisma.kb_documents.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Không tìm thấy tài liệu kho kiến thức');
    }

    // 1. Phân đoạn nội dung thành các chunk nhỏ (300 - 800 ký tự)
    const rawChunks = this.splitContentIntoChunks(doc.content);

    // 2. Sinh vector embedding cho toàn bộ chunks
    const embeddings = await this.aiService.embed(rawChunks);

    // 3. Transaction xóa chunk cũ (nếu có) và tạo mới
    await this.prisma.$transaction(async (tx) => {
      await tx.kb_chunks.deleteMany({ where: { document_id: id } });

      for (let i = 0; i < rawChunks.length; i++) {
        await tx.kb_chunks.create({
          data: {
            document_id: id,
            chunk_index: i + 1,
            content: rawChunks[i],
            embedding: embeddings[i],
            embedding_model: 'text-embedding-004',
          },
        });
      }

      await tx.kb_documents.update({
        where: { id },
        data: {
          status: 'approved',
          approved_by: actorId,
          approved_at: new Date(),
        },
      });
    });

    this.logger.log(`[KB Approved] Document "${doc.title}" đã duyệt với ${rawChunks.length} chunks.`);

    return {
      message: 'Tài liệu đã được duyệt và sinh vector embedding thành công!',
      documentId: id,
      totalChunks: rawChunks.length,
    };
  }

  /**
   * Tìm kiếm vector tương đồng (Cosine Similarity) trên các chunk đã duyệt (TC-009)
   */
  async searchRelevantChunks(query: string, topK = 3, minSimilarity = 0.45) {
    // 1. Sinh vector nhúng cho câu hỏi
    const [queryEmbedding] = await this.aiService.embed([query]);

    // 2. Lấy tất cả các chunk của các tài liệu ĐÃ DUYỆT (status = 'approved')
    const approvedChunks = await this.prisma.kb_chunks.findMany({
      where: {
        kb_documents: {
          status: 'approved',
        },
      },
      include: {
        kb_documents: {
          select: {
            title: true,
            category: true,
          },
        },
      },
    });

    if (approvedChunks.length === 0) {
      return [];
    }

    // 3. Tính độ tương đồng Cosine ở tầng ứng dụng
    const ranked = approvedChunks
      .map((c) => {
        let emb = c.embedding;
        if (typeof emb === 'string') {
          try {
            emb = JSON.parse(emb);
          } catch {
            emb = null;
          }
        }
        const similarity = Array.isArray(emb) ? cosineSimilarity(queryEmbedding, emb as any as number[]) : 0;
        return {
          id: c.id,
          documentId: c.document_id,
          documentTitle: c.kb_documents.title,
          category: c.kb_documents.category,
          chunkIndex: c.chunk_index,
          content: c.content,
          similarity: Math.round(similarity * 1000) / 1000,
        };
      })
      .filter((r) => r.similarity >= minSimilarity);

    ranked.sort((a, b) => b.similarity - a.similarity);
    return ranked.slice(0, topK);
  }

  /**
   * Thuật toán phân đoạn văn bản thông minh theo đoạn văn & giới hạn độ dài
   */
  private splitContentIntoChunks(content: string, maxChunkLength = 600, overlap = 80): string[] {
    const paragraphs = content.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + ' ' + para).length > maxChunkLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        // Lấy đoạn overlap cuối của chunk trước
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + ' ' + para;
      } else {
        currentChunk = currentChunk.length === 0 ? para : currentChunk + '\n\n' + para;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [content];
  }
}
