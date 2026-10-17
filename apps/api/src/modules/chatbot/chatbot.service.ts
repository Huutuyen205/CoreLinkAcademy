import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { AiGuardrails, Anonymizer } from '@corelink/ai';
import { normalizeVietnamesePhone, isValidVietnamesePhone } from '@corelink/shared';

export interface ChatDto {
  sessionId?: string;
  visitorKey: string;
  message: string;
  utmSource?: string;
  utmCampaign?: string;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly kbService: KnowledgeBaseService,
  ) {}

  /**
   * Xử lý hội thoại của chatbot tư vấn với bảo vệ đa tầng (AI-12, FR-103, S03)
   * TC-009, TC-010, TC-011, TC-012, TC-013, TC-014
   */
  async handleChat(dto: ChatDto, userId?: string) {
    const defaultBranch = await this.prisma.branches.findFirst({ where: { is_active: true } });
    const branchId = defaultBranch?.id || '00000000-0000-0000-0000-000000000001';

    // 1. Quản lý phiên hội thoại (chat_sessions)
    let session = dto.sessionId
      ? await this.prisma.chat_sessions.findUnique({ where: { id: dto.sessionId } })
      : null;

    if (!session) {
      session = await this.prisma.chat_sessions.create({
        data: {
          branch_id: branchId,
          visitor_key: dto.visitorKey,
          user_id: userId,
          utm_source: dto.utmSource,
          utm_campaign: dto.utmCampaign,
        },
      });
    }

    const userMessage = dto.message.trim();

    // 2. TẦNG BẢO VỆ 1: Guardrail kiểm tra Prompt Injection & An toàn dữ liệu trẻ em
    const guardrailCheck = AiGuardrails.inspectInput(userMessage);

    // TC-011: Chặn Prompt Injection
    // TC-012: Chặn dò hỏi dữ liệu trẻ em
    if (!guardrailCheck.passed && guardrailCheck.cannedResponse) {
      // Ghi turn người dùng
      await this.prisma.chat_turns.create({
        data: {
          session_id: session.id,
          role: 'visitor',
          content: userMessage,
        },
      });

      // Ghi turn bot từ chối an toàn
      const botTurn = await this.prisma.chat_turns.create({
        data: {
          session_id: session.id,
          role: 'bot',
          content: guardrailCheck.cannedResponse,
        },
      });

      return {
        sessionId: session.id,
        turnId: botTurn.id.toString(),
        message: guardrailCheck.cannedResponse,
        citedChunkIds: [],
        sources: [],
        isSafeRefusal: true,
      };
    }

    // 3. TẦNG BẢO VỆ 2: Kiểm tra ý định Chuyển tư vấn viên hoặc Đăng ký học thử (TC-013)
    if (guardrailCheck.detectedIntent === 'request_human') {
      await this.prisma.chat_sessions.update({
        where: { id: session.id },
        data: { handed_off_at: new Date() },
      });

      const handoffText =
        'Dạ, em đã ghi nhận yêu cầu của Quý khách. Chuyên viên tư vấn tuyển sinh CoreLink sẽ hỗ trợ trực tiếp ngay. Quý khách vui lòng để lại Số điện thoại hoặc gọi hotline 1900-xxxx để được phục vụ nhanh nhất ạ!';

      await this.recordTurns(session.id, userMessage, handoffText);

      return {
        sessionId: session.id,
        message: handoffText,
        citedChunkIds: [],
        sources: [],
        isHandoff: true,
      };
    }

    // Kiểm tra nếu tin nhắn chứa SĐT đăng ký -> Tự động tạo Lead (TC-013)
    const phoneMatch = userMessage.match(/(\+84|0)[3|5|7|8|9][0-9]{8}\b/);
    if (phoneMatch && isValidVietnamesePhone(phoneMatch[0])) {
      const normalizedPhone = normalizeVietnamesePhone(phoneMatch[0]);

      // Tạo hoặc tìm lead
      const existingLead = await this.prisma.leads.findUnique({
        where: { branch_id_phone: { branch_id: branchId, phone: normalizedPhone } },
      });

      let leadId = existingLead?.id;
      if (!existingLead) {
        const newLead = await this.prisma.leads.create({
          data: {
            branch_id: branchId,
            phone: normalizedPhone,
            source: 'chatbot',
            utm_source: session.utm_source,
            utm_campaign: session.utm_campaign,
            status: 'new',
            consent_given_at: new Date(),
          },
        });
        leadId = newLead.id;
      }

      await this.prisma.chat_sessions.update({
        where: { id: session.id },
        data: { lead_id: leadId, handed_off_at: new Date() },
      });

      const leadResponse =
        `Dạ, em đã lưu lại số điện thoại ${phoneMatch[0]} của Quý khách rồi ạ! Đội ngũ tư vấn CoreLink sẽ liên hệ lại sớm nhất để gửi lịch học thử chi tiết cho gia đình nhé!`;

      await this.recordTurns(session.id, userMessage, leadResponse);

      return {
        sessionId: session.id,
        message: leadResponse,
        citedChunkIds: [],
        sources: [],
        isLeadCaptured: true,
      };
    }

    // 4. TẦNG RAG: Tìm kiếm các đoạn tri thức liên quan từ kho kiến thức ĐÃ DUYỆT (TC-009)
    const relevantChunks = await this.kbService.searchRelevantChunks(userMessage, 3, 0.35);

    // TC-010: Nếu không có tài liệu nào khớp -> Từ chối bịa đặt, đề xuất chuyển tư vấn viên
    if (relevantChunks.length === 0) {
      const fallbackMsg =
        'Dạ, hiện tại thông tin này chưa có trong tài liệu đào tạo chính thức của trung tâm. Em xin phép ghi nhận câu hỏi để tư vấn viên chuyên môn liên hệ giải đáp chi tiết cho Quý khách ạ!';

      await this.recordTurns(session.id, userMessage, fallbackMsg);

      return {
        sessionId: session.id,
        message: fallbackMsg,
        citedChunkIds: [],
        sources: [],
      };
    }

    // 5. Chuẩn bị ngữ cảnh và Prompt gọi AI Gateway (AI-12, TC-009, TC-014)
    const contextSnippets = relevantChunks
      .map((c) => `[Tài liệu: ${c.documentTitle} | Mã: ${c.id}]\n${c.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = `Bạn là Trợ lý tư vấn tuyển sinh CoreLink Academy.
Hãy trả lời câu hỏi của khách hàng một cách ngắn gọn, súc tích và thân thiện.
CHỈ ĐƯỢC PHÉP trả lời dựa trên CÁC ĐOẠN KIẾN THỨC sau đây và bắt buộc trích dẫn [Mã: id]:

${contextSnippets}

Quy tắc: Không bịa đặt học phí hay chính sách ngoài nội dung trên.`;

    // Ẩn danh hóa thông tin nhạy cảm trước khi gọi AI bên ngoài (Luật BV Dữ liệu cá nhân)
    const anonymizedMsg = Anonymizer.anonymize(userMessage).text;

    // Gọi AI Gateway
    const aiResult = await this.aiService.generate(
      {
        feature: 'AI-12',
        system: systemPrompt,
        messages: [{ role: 'user', content: anonymizedMsg }],
        maxTokens: 512,
        entity: { type: 'chat_session', id: session.id },
      },
      { branchId }
    );

    // Lấy ID của các chunk thực tế được AI trích dẫn
    let citedChunkIds: string[] = [];
    if (!aiResult.text.includes('chưa có trong tài liệu đào tạo chính thức')) {
      const citedMatches = Array.from(aiResult.text.matchAll(/\[Mã:\s*([a-zA-Z0-9_\-]+)\]/g));
      if (citedMatches.length > 0) {
        citedChunkIds = Array.from(new Set(citedMatches.map((m) => m[1])));
      } else {
        citedChunkIds = relevantChunks.map((c) => c.id);
      }
    }

    const sources = relevantChunks
      .filter((c) => citedChunkIds.includes(c.id))
      .map((c) => ({
        chunkId: c.id,
        title: c.documentTitle,
        category: c.category,
        similarity: c.similarity,
      }));

    // Ghi nhận chat turns
    await this.prisma.chat_turns.create({
      data: {
        session_id: session.id,
        role: 'visitor',
        content: userMessage,
      },
    });

    const botTurn = await this.prisma.chat_turns.create({
      data: {
        session_id: session.id,
        role: 'bot',
        content: aiResult.text,
        cited_chunk_ids: citedChunkIds,
      },
    });

    return {
      sessionId: session.id,
      turnId: botTurn.id.toString(),
      message: aiResult.text,
      citedChunkIds,
      sources,
      tokens: {
        input: aiResult.inputTokens,
        output: aiResult.outputTokens,
      },
      costUsd: aiResult.costUsd,
    };
  }

  /**
   * Lấy lịch sử hội thoại của một phiên chat
   */
  async getSessionHistory(sessionId: string) {
    return this.prisma.chat_turns.findMany({
      where: { session_id: sessionId },
      orderBy: { id: 'asc' },
    });
  }

  private async recordTurns(sessionId: string, userMsg: string, botMsg: string) {
    await this.prisma.chat_turns.create({
      data: { session_id: sessionId, role: 'visitor', content: userMsg },
    });
    return this.prisma.chat_turns.create({
      data: { session_id: sessionId, role: 'bot', content: botMsg },
    });
  }
}
