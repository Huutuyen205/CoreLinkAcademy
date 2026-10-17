import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  questions_type,
  questions_skill,
  questions_framework,
  questions_status,
  assignments_kind,
  assignments_show_answer_mode,
  assignment_targets_target_type,
  attempts_submit_mode,
} from '@prisma/client';

@Controller('assessment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  // =========================================================================
  // QUESTIONS ENDPOINTS
  // =========================================================================

  @Post('questions')
  createQuestion(
    @Req() req: any,
    @Body()
    body: {
      branchId?: string;
      type: questions_type;
      stem: string;
      options?: any;
      answerKey?: any;
      explanation?: string;
      skill: questions_skill;
      difficulty: number;
      framework: questions_framework;
      levelCode: string;
      topic?: string;
      points?: number;
      rubricId?: string;
    },
  ) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.createQuestion(userId, body);
  }

  @Get('questions')
  getQuestions(
    @Query()
    query: {
      skill?: questions_skill;
      framework?: questions_framework;
      levelCode?: string;
      difficulty?: number;
      status?: questions_status;
      type?: questions_type;
      keyword?: string;
      limit?: number;
      page?: number;
    },
  ) {
    return this.assessmentService.getQuestions(query);
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.assessmentService.deleteQuestion(id);
  }

  @Post('questions/generate-ai')
  generateAiQuestion(
    @Req() req: any,
    @Body()
    body: {
      branchId?: string;
      type: questions_type;
      stem: string;
      options?: any;
      answerKey?: any;
      explanation?: string;
      skill: questions_skill;
      difficulty: number;
      framework: questions_framework;
      levelCode: string;
      topic?: string;
    },
  ) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.generateAiQuestion(userId, body);
  }

  @Post('questions/:id/approve')
  approveQuestion(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.approveQuestion(id, userId);
  }

  // =========================================================================
  // ASSIGNMENTS ENDPOINTS
  // =========================================================================

  @Post('assignments')
  createAssignment(
    @Req() req: any,
    @Body()
    body: {
      branchId?: string;
      classId?: string;
      title: string;
      kind: assignments_kind;
      instructions?: string;
      opensAt?: string;
      dueAt?: string;
      timeLimitMin?: number;
      attemptsAllowed?: number;
      shuffle?: boolean;
      showAnswerMode?: assignments_show_answer_mode;
      questionIds: string[];
      targets: Array<{
        targetType: assignment_targets_target_type;
        classId?: string;
        groupId?: string;
        studentId?: string;
      }>;
    },
  ) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.createAssignment(userId, body);
  }

  @Get('assignments')
  getAssignments(
    @Req() req: any,
    @Query() query: { classId?: string; kind?: assignments_kind; status?: 'active' | 'closed' },
  ) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.getAssignments(userId, query);
  }

  @Get('assignments/:id')
  getAssignmentById(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.getAssignmentById(id, userId);
  }

  @Post('assignments/:id/publish')
  publishResults(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.publishResults(userId, id);
  }

  // =========================================================================
  // ATTEMPTS & TAKING EXAM ENDPOINTS
  // =========================================================================

  @Post('assignments/:id/attempts')
  startAttempt(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.startAttempt(id, userId);
  }

  @Put('attempts/:id/answers')
  saveDraftAnswers(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      answers: Array<{
        questionId: string;
        response?: any;
        fileId?: string;
      }>;
    },
  ) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.saveDraftAnswers(userId, id, body.answers);
  }

  @Post('attempts/:id/submit')
  submitAttempt(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body?: {
      submitMode?: attempts_submit_mode;
      tabLeaves?: number;
    },
  ) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.submitAttempt(userId, id, body);
  }

  @Patch('attempts/:id/grade')
  gradeManual(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      grades: Array<{
        questionId: string;
        finalPoints: number;
        feedback?: string;
      }>;
      overallFeedback?: string;
    },
  ) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.gradeManualEssay(
      userId,
      id,
      body.grades,
      body.overallFeedback,
    );
  }

  @Get('attempts/:id/results')
  getAttemptResult(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.getAttemptResult(id, userId);
  }

  // =========================================================================
  // REGRADE REQUESTS ENDPOINTS
  // =========================================================================

  @Post('attempts/:id/regrade-requests')
  requestRegrade(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.requestRegrade(userId, id, body.reason);
  }

  @Patch('regrade-requests/:id')
  processRegrade(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      status: 'accepted' | 'rejected';
      newScore?: number;
      response: string;
    },
  ) {
    const userId = req.user.id || req.user.sub;
    return this.assessmentService.processRegrade(userId, id, body);
  }

  // =========================================================================
  // AUTOMATION JOBS
  // =========================================================================

  @Post('jobs/due-reminders')
  runDueReminders() {
    return this.assessmentService.runDueReminderJob();
  }

  @Post('jobs/regrade-escalation')
  runRegradeEscalation() {
    return this.assessmentService.runRegradeEscalationJob();
  }
}
