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
  ParentsProgressService,
  BatchEvaluationDto,
} from './parents-progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentsProgressController {
  constructor(
    private readonly parentsProgressService: ParentsProgressService,
  ) {}

  /**
   * TC-099: Teacher batch evaluations for a class (< 3 mins)
   */
  @Post('evaluations/batch')
  async createBatchEvaluation(
    @Req() req: any,
    @Body() body: BatchEvaluationDto,
  ) {
    return this.parentsProgressService.createBatchEvaluation(body, req.user.id);
  }

  /**
   * Get student evaluations
   */
  @Get('evaluations/student/:studentId')
  async getStudentEvaluations(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    return this.parentsProgressService.getStudentEvaluations(
      studentId,
      req.user,
    );
  }

  /**
   * TC-100: Get student roadmap progress %, 8-week score trend, attendance rate
   */
  @Get('progress/student/:studentId')
  async getStudentProgress(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    return this.parentsProgressService.getStudentProgress(studentId, req.user);
  }

  /**
   * TC-103: Parent overview matching teacher entered data (< 2s)
   */
  @Get('parent/overview/:studentId')
  async getParentOverview(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    return this.parentsProgressService.getParentOverview(studentId, req.user);
  }

  /**
   * TC-106: Guardian children list for child switcher
   */
  @Get('parent/children')
  async getGuardianChildren(@Req() req: any) {
    return this.parentsProgressService.getGuardianChildren(req.user.id);
  }

  /**
   * TC-104 & TC-105: Trigger 20:00 Daily Summary Job
   */
  @Post('daily-summaries/run-job')
  async runDailySummariesJob(
    @Body() body?: { target_date?: string },
  ) {
    return this.parentsProgressService.runDailySummariesJob(body?.target_date);
  }

  /**
   * Get daily summaries for student
   */
  @Get('daily-summaries/student/:studentId')
  async getStudentDailySummaries(
    @Req() req: any,
    @Param('studentId') studentId: string,
  ) {
    return this.parentsProgressService.getStudentDailySummaries(
      studentId,
      req.user,
    );
  }
}
