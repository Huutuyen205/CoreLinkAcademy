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
  CompetencyService,
  GenerateAiQuestionsDto,
  AiTutorChatDto,
  RecordSpeakingAnswerDto,
  CompetencyScoreDto,
} from './competency.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@corelink/shared';

@Controller('competency')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompetencyController {
  constructor(private readonly competencyService: CompetencyService) {}

  // =========================================================================
  // 1. AI TẠO ĐỀ & PHÊ DUYỆT CÂU HỎI (TC-091)
  // =========================================================================

  @Post('ai-questions/generate')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async generateAiQuestions(
    @Req() req: any,
    @Body() body: GenerateAiQuestionsDto,
  ) {
    return this.competencyService.generateAiQuestions(body, req.user.id);
  }

  @Post('ai-questions/:id/approve')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async approveAiQuestion(@Req() req: any, @Param('id') questionId: string) {
    return this.competencyService.approveAiQuestion(questionId, req.user.id);
  }

  // =========================================================================
  // 2. GHI ÂM CÂU HỎI NÓI (TC-094)
  // =========================================================================

  @Post('speaking-answers')
  @Roles(RoleCode.STUDENT, RoleCode.ADMIN)
  async recordSpeakingAnswer(
    @Req() req: any,
    @Body() body: RecordSpeakingAnswerDto,
  ) {
    return this.competencyService.recordSpeakingAnswer(body, req.user.id);
  }

  // =========================================================================
  // 3. GỢI Ý ÔN LUYỆN THEO KỸ NĂNG YẾU (TC-095)
  // =========================================================================

  @Get('weak-skills/:studentId')
  @Roles(RoleCode.STUDENT, RoleCode.GUARDIAN, RoleCode.TEACHER, RoleCode.ADMIN)
  async getWeakSkillRecommendations(@Param('studentId') studentId: string) {
    return this.competencyService.getWeakSkillRecommendations(studentId);
  }

  // =========================================================================
  // 4. GIA SƯ AI THÔNG MINH (TC-096)
  // =========================================================================

  @Post('tutor/chat')
  async chatWithAiTutor(@Req() req: any, @Body() body: AiTutorChatDto) {
    return this.competencyService.chatWithAiTutor(body, req.user.id);
  }

  // =========================================================================
  // 5. CHỐNG GIAN LẬN: RỜI TAB (TC-097)
  // =========================================================================

  @Post('attempts/:id/tab-leave')
  async recordTabLeave(@Param('id') attemptId: string) {
    return this.competencyService.recordTabLeave(attemptId);
  }

  // =========================================================================
  // 6. ĐIỂM NĂNG LỰC & BIỂU ĐỒ RADAR (TC-101)
  // =========================================================================

  @Post('scores')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async recordCompetencyScore(@Body() body: CompetencyScoreDto) {
    return this.competencyService.recordCompetencyScore(body);
  }

  @Get('radar/:studentId')
  @Roles(RoleCode.STUDENT, RoleCode.GUARDIAN, RoleCode.TEACHER, RoleCode.ADMIN)
  async getStudentCompetencyRadar(@Param('studentId') studentId: string) {
    return this.competencyService.getStudentCompetencyRadar(studentId);
  }

  // =========================================================================
  // 7. CÁ NHÂN HÓA ĐỘ KHÓ (FR-613)
  // =========================================================================

  @Get('adaptive-difficulty/:studentId')
  @Roles(RoleCode.STUDENT, RoleCode.TEACHER, RoleCode.ADMIN)
  async getNextAdaptiveDifficulty(
    @Param('studentId') studentId: string,
    @Query('current_tier') currentTier?: string,
  ) {
    return this.competencyService.getNextAdaptiveDifficulty(
      studentId,
      currentTier ? parseInt(currentTier, 10) : 2,
    );
  }

  // =========================================================================
  // 8. AI SPEAKING COACH (PHÂN TÍCH LUYỆN NÓI TRỰC TIẾP)
  // =========================================================================

  @Post('speaking-coach/analyze')
  @Roles(RoleCode.STUDENT, RoleCode.TEACHER, RoleCode.ADMIN)
  async analyzeSpeakingCoach(
    @Req() req: any,
    @Body() body: { topic: string; transcript: string; duration_seconds?: number },
  ) {
    return this.competencyService.analyzeSpeakingCoach(body, req.user.id);
  }

  // =========================================================================
  // 9. SỔ TAY TỪ VỰNG FLASHCARD (SPACED REPETITION SM-2)
  // =========================================================================

  @Get('vocabulary/flashcards')
  @Roles(RoleCode.STUDENT, RoleCode.TEACHER, RoleCode.ADMIN)
  async getSpacedRepetitionFlashcards(@Query('category') category?: string) {
    return this.competencyService.getSpacedRepetitionFlashcards(category);
  }

  @Post('vocabulary/review')
  @Roles(RoleCode.STUDENT, RoleCode.TEACHER, RoleCode.ADMIN)
  async reviewFlashcard(@Body() body: { cardId: string; quality: number }) {
    return this.competencyService.reviewFlashcard(body.cardId, body.quality);
  }
}
