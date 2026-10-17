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
  AiGradingService,
  GradeWritingEssayDto,
  GradeSpeakingRecordingDto,
  ConfirmTeacherGradeDto,
  StudentEvaluationFactsDto,
  ApproveMonthlyReportsBatchDto,
  SuggestReplyDto,
} from './ai-grading.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@corelink/shared';

@Controller('ai-grading')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiGradingController {
  constructor(private readonly aiGradingService: AiGradingService) {}

  // =========================================================================
  // 1. AI CHẤM BÀI VIẾT (TC-092, TC-093)
  // =========================================================================

  @Post('writing')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async gradeWritingEssay(@Req() req: any, @Body() body: GradeWritingEssayDto) {
    return this.aiGradingService.gradeWritingEssay(body, req.user.id);
  }

  // =========================================================================
  // 2. AI CHẤM BÀI NÓI (SPEAKING)
  // =========================================================================

  @Post('speaking')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async gradeSpeakingRecording(@Body() body: GradeSpeakingRecordingDto) {
    return this.aiGradingService.gradeSpeakingRecording(body);
  }

  // =========================================================================
  // 3. GIÁO VIÊN DUYỆT / CHỐT ĐIỂM (TC-092)
  // =========================================================================

  @Post('confirm/:answerId')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async confirmTeacherGrade(
    @Req() req: any,
    @Param('answerId') answerId: string,
    @Body() body: ConfirmTeacherGradeDto,
  ) {
    return this.aiGradingService.confirmTeacherGrade(answerId, body, req.user.id);
  }

  // =========================================================================
  // 4. NHẬN XÉT AI DỰA TRÊN DỮ KIỆN (TC-102)
  // =========================================================================

  @Post('evaluation-facts')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async generateAiStudentEvaluation(@Body() body: StudentEvaluationFactsDto) {
    return this.aiGradingService.generateAiStudentEvaluation(body);
  }

  // =========================================================================
  // 5. BÁO CÁO THÁNG PHỤ HUYNH & DUYỆT HÀNG LOẠT (TC-107, TC-108)
  // =========================================================================

  @Post('monthly-reports/generate-batch')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async generateMonthlyReportsBatch(
    @Body() body: { class_id: string; month: string },
  ) {
    return this.aiGradingService.generateMonthlyReportsBatch(body.class_id, body.month);
  }

  @Post('monthly-reports/approve-batch')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async approveMonthlyReportsBatch(
    @Req() req: any,
    @Body() body: ApproveMonthlyReportsBatchDto,
  ) {
    return this.aiGradingService.approveMonthlyReportsBatch(body, req.user.id);
  }

  @Get('monthly-reports/reminder-check')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async checkPendingMonthlyReportsReminder(@Query('month') month: string) {
    return this.aiGradingService.checkPendingMonthlyReportsReminder(month || '2026-10');
  }

  // =========================================================================
  // 6. GỢI Ý TRẢ LỜI TIN NHẮN (TC-120)
  // =========================================================================

  @Post('suggest-reply')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async suggestMessageReply(@Body() body: SuggestReplyDto) {
    return this.aiGradingService.suggestMessageReply(body);
  }

  // =========================================================================
  // 7. THỐNG KÊ ĐỘ LỆCH ĐIỂM
  // =========================================================================

  @Get('deviation')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async getMonthlyGradingDeviation() {
    return this.aiGradingService.getMonthlyGradingDeviation();
  }
}
