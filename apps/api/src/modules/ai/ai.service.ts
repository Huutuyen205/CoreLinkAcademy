import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CoreLinkAiGateway,
  AiGatewayGenerateRequest,
  AiResult,
  AiFeature,
} from '@corelink/ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly gateway = new CoreLinkAiGateway();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gọi AI sinh phản hồi kèm lưu vết ai_jobs và kiểm soát chi phí (FR-1502, TC-014)
   */
  async generate(
    req: AiGatewayGenerateRequest,
    options?: {
      branchId?: string;
      actorId?: string;
      entity?: { type: string; id: string };
    }
  ): Promise<AiResult> {
    const startTime = Date.now();

    // Lấy default branch nếu không có
    let branchId = options?.branchId;
    if (!branchId) {
      const defaultBranch = await this.prisma.branches.findFirst({ where: { is_active: true } });
      branchId = defaultBranch?.id || '00000000-0000-0000-0000-000000000001';
    }

    try {
      const result = await this.gateway.generate(req);

      // Ghi nhật ký ai_jobs vào cơ sở dữ liệu (TC-014)
      await this.prisma.ai_jobs.create({
        data: {
          branch_id: branchId,
          feature: req.feature,
          provider: result.provider,
          model: result.model,
          status: 'done',
          input_tokens: result.inputTokens,
          output_tokens: result.outputTokens,
          cost_usd: result.costUsd,
          entity: options?.entity?.type,
          entity_id: options?.entity?.id,
          request_log: {
            system: req.system,
            messagesCount: req.messages.length,
            lastUserMessage: req.messages[req.messages.length - 1]?.content,
          },
          response_log: {
            textPreview: result.text.slice(0, 300),
          },
          created_by: options?.actorId,
          finished_at: new Date(),
        },
      });

      this.logger.log(
        `[AiJob Done] Feature: ${req.feature} | Provider: ${result.provider} | Tokens: ${result.inputTokens}+${result.outputTokens} | Cost: $${result.costUsd} | Latency: ${Date.now() - startTime}ms`
      );

      return result;
    } catch (err: any) {
      this.logger.error(`[AiJob Failed] Feature: ${req.feature} | Error: ${err.message}`);

      // Ghi nhận lỗi vào ai_jobs
      await this.prisma.ai_jobs.create({
        data: {
          branch_id: branchId,
          feature: req.feature,
          provider: 'unknown',
          model: 'unknown',
          status: 'failed',
          error_message: err.message,
          created_by: options?.actorId,
          finished_at: new Date(),
        },
      });

      throw err;
    }
  }

  /**
   * Sinh vector embedding cho văn bản
   */
  async embed(texts: string[]): Promise<number[][]> {
    return this.gateway.embed(texts);
  }

  /**
   * Báo cáo chi phí AI theo tháng (FR-1502, S40)
   */
  async getMonthlyCostReport(branchId?: string) {
    const rawData = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM v_ai_cost_month ORDER BY cost_month DESC LIMIT 12`
    );

    return rawData.map((row) => {
      const sanitized: any = {};
      for (const [k, v] of Object.entries(row)) {
        sanitized[k] = typeof v === 'bigint' ? Number(v) : v;
      }
      return sanitized;
    });
  }
}
