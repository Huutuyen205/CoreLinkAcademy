import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import {
  AdminSystemService,
  CreateSurveyDto,
  SubmitSurveyResponseDto,
  ProcessImportDto,
} from './admin-system.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@corelink/shared';
import { Response } from 'express';

@Controller('admin-system')
export class AdminSystemController {
  constructor(private readonly adminSystemService: AdminSystemService) {}

  // =========================================================================
  // 1. KHẢO SÁT (TC-138, TC-139)
  // =========================================================================

  @Post('surveys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC)
  async createSurvey(@Req() req: any, @Body() body: CreateSurveyDto) {
    return this.adminSystemService.createSurvey(body, req.user.id);
  }

  /**
   * TC-138: Người dùng gửi khảo sát (mỗi người 1 lần, mã hoá SHA-256 ẩn danh)
   */
  @Post('surveys/responses')
  @UseGuards(JwtAuthGuard)
  async submitSurveyResponse(
    @Req() req: any,
    @Body() body: SubmitSurveyResponseDto,
  ) {
    return this.adminSystemService.submitSurveyResponse(body, req.user.id);
  }

  /**
   * TC-139: Giáo viên xem kết quả khảo sát (không hiện danh tính người trả lời)
   */
  @Get('surveys/:surveyId/teacher-results/:teacherId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async getTeacherSurveyResults(
    @Param('surveyId') surveyId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.adminSystemService.getTeacherSurveyResults(surveyId, teacherId);
  }

  // =========================================================================
  // 2. NHẬP DỮ LIỆU EXCEL (TC-141..TC-143)
  // =========================================================================

  /**
   * TC-141, TC-142, TC-143: Xử lý nhập file
   */
  @Post('imports/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async processImport(@Req() req: any, @Body() body: ProcessImportDto) {
    return this.adminSystemService.processImport(body, req.user.id);
  }

  // =========================================================================
  // 3. QUẢN TRỊ & NHẬT KÝ (TC-144..TC-148)
  // =========================================================================

  /**
   * TC-144: Nhật ký audit logs bất biến (chỉ GET, không có PUT/DELETE)
   */
  @Get('audit-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async getAuditLogs(
    @Query('actor_id') actorId?: string,
    @Query('entity') entity?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminSystemService.getAuditLogs({
      actor_id: actorId,
      entity,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  /**
   * TC-145, TC-146: Kiểm tra hạn mức chi phí AI
   */
  @Get('ai-budget/check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async checkAiBudget(
    @Query('branch_id') branchId: string,
    @Query('feature') feature: string = 'lead_chatbot',
  ) {
    return this.adminSystemService.checkAiBudget(branchId, feature);
  }

  /**
   * TC-147: Kiểm tra sao lưu toàn vẹn
   */
  @Get('backups/check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async checkBackupIntegrity() {
    return this.adminSystemService.checkBackupIntegrity();
  }

  /**
   * TC-148: Xuất toàn bộ dữ liệu hệ thống (ZIP)
   */
  @Get('export-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN)
  async exportAll(@Query('branch_id') branchId: string, @Res() res: Response) {
    const zipBuffer = await this.adminSystemService.exportAllSystemData(branchId);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="corelink-backup-${Date.now()}.zip"`,
    );
    res.setHeader('Content-Length', zipBuffer.length);
    return res.end(zipBuffer);
  }

  // =========================================================================
  // 4. LINK RIÊNG TƯ CÓ THỜI HẠN (TC-151)
  // =========================================================================

  /**
   * TC-151: Tạo liên kết tải file riêng tư có thời hạn
   */
  @Post('files/signed-url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleCode.ADMIN, RoleCode.TEACHER, RoleCode.ACCOUNTANT)
  async createSignedUrl(
    @Body('file_id') fileId: string,
    @Body('ttl_seconds') ttlSeconds?: number,
  ) {
    return this.adminSystemService.createSignedUrl(fileId, ttlSeconds || 300);
  }

  /**
   * TC-151: Tải file riêng tư qua chữ ký và thời hạn (xác thực trực tiếp bằng signature & expiry)
   */
  @Get('files/download')
  async downloadSignedFile(
    @Query('fileId') fileId: string,
    @Query('expires') expires: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    this.adminSystemService.verifySignedUrl(
      fileId,
      parseInt(expires, 10),
      token,
    );

    // Trả về file tải về thành công
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="file-${fileId}.bin"`);
    return res.send(Buffer.from(`Nội dung tệp riêng tư bảo mật id=${fileId}`, 'utf-8'));
  }
}
