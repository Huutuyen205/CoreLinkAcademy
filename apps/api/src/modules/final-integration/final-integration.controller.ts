import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  FinalIntegrationService,
  PaymentWebhookPayload,
  DiscontinueStudentDto,
} from './final-integration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@corelink/shared';

@Controller('final-integration')
export class FinalIntegrationController {
  constructor(private readonly finalService: FinalIntegrationService) {}

  // =========================================================================
  // 1. THANH TOÁN ONLINE & TỰ ĐỐI SOÁT WEBHOOK (FR-1103 / TC-132)
  // Webhook công khai gọi bởi cổng thanh toán, bảo mật bằng HMAC SHA-256
  // =========================================================================

  @Post('payments/webhook')
  async handlePaymentWebhook(@Body() body: PaymentWebhookPayload) {
    return this.finalService.handlePaymentWebhook(body);
  }

  // =========================================================================
  // 2. CHIẾN DỊCH THEO MÙA & MÃ ƯU ĐÃI (FR-109)
  // Công khai để học viên/phụ huynh xem thông tin khuyến mãi
  // =========================================================================

  @Get('campaigns/:code')
  async getCampaignDetails(@Param('code') discountCode: string) {
    return this.finalService.getCampaignDetails(discountCode);
  }

  // =========================================================================
  // 3. QUY TRÌNH NGỪNG HỌC & ẨN DANH HÓA BẢO VỆ DỮ LIỆU (FR-210)
  // =========================================================================

  @Post('students/:id/discontinue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC)
  async discontinueStudent(
    @Param('id') studentId: string,
    @Body() body: DiscontinueStudentDto,
  ) {
    return this.finalService.discontinueStudent(studentId, body);
  }

  @Post('students/:id/anonymize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async anonymizeStudentData(@Param('id') studentId: string) {
    return this.finalService.anonymizeStudentData(studentId);
  }

  // =========================================================================
  // 4. TÌM KIẾM & GHIM TIN NHẮN TRONG HỘI THOẠI (FR-907)
  // =========================================================================

  @Get('conversations/:id/messages/search')
  @UseGuards(JwtAuthGuard)
  async searchMessages(
    @Param('id') conversationId: string,
    @Query('q') keyword: string,
  ) {
    return this.finalService.searchMessages(conversationId, keyword);
  }

  @Post('conversations/:id/messages/:msgId/pin')
  @UseGuards(JwtAuthGuard)
  async pinMessage(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Param('msgId') messageId: string,
  ) {
    return this.finalService.pinMessage(conversationId, messageId, req.user.id);
  }
}
