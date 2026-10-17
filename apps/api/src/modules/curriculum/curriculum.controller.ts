import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurriculumService, FilePayload } from './curriculum.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { materials_type, files_copyright_source } from '@prisma/client';

@Controller('curriculum')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  /**
   * TC-066, TC-067, TC-068: Admin uploads framework curriculum
   * Accepts both multipart form-data (via interceptor) and JSON payload with base64/buffer
   */
  @Post('framework')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFramework(
    @Req() req: any,
    @UploadedFile() file: any,
    @Body()
    body: {
      curriculum_id?: string;
      branch_id?: string;
      program_id?: string;
      title?: string;
      change_note?: string;
      file_base64?: string;
      file_name?: string;
      file_mimetype?: string;
      file_size?: number;
    },
  ) {
    let payloadFile: FilePayload | null = null;

    if (file) {
      payloadFile = {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      };
    } else if (body.file_base64) {
      const buffer = Buffer.from(body.file_base64, 'base64');
      payloadFile = {
        buffer,
        originalname: body.file_name || 'document.pdf',
        mimetype: body.file_mimetype || 'application/pdf',
        size: body.file_size || buffer.length,
      };
    }

    if (!payloadFile) {
      throw new BadRequestException('Vui lòng chọn file tải lên');
    }

    return this.curriculumService.uploadFramework(
      {
        curriculum_id: body.curriculum_id,
        branch_id: body.branch_id,
        program_id: body.program_id,
        title: body.title,
        change_note: body.change_note,
      },
      payloadFile,
      req.user.id,
    );
  }

  /**
   * TC-066: Get curricula & versions according to role
   */
  @Get('framework')
  async getCurricula(@Req() req: any) {
    return this.curriculumService.getCurricula(req.user);
  }

  /**
   * TC-069: Teacher uploads draft lesson plan
   */
  @Post('lesson-plans')
  async createLessonPlan(
    @Req() req: any,
    @Body()
    body: {
      branch_id?: string;
      lesson_node_id?: string;
      title: string;
      content?: string;
      file_id?: string;
    },
  ) {
    return this.curriculumService.createLessonPlan(body, req.user.id);
  }

  /**
   * TC-069: View lesson plans (teachers only see own drafts + approved)
   */
  @Get('lesson-plans')
  async getLessonPlans(@Req() req: any) {
    return this.curriculumService.getLessonPlans(req.user);
  }

  /**
   * Admin / Academic approves lesson plan
   */
  @Post('lesson-plans/:id/approve')
  async approveLessonPlan(@Req() req: any, @Param('id') id: string) {
    return this.curriculumService.approveLessonPlan(id, req.user.id);
  }

  /**
   * TC-071: Upload/create material with copyright source declaration
   */
  @Post('materials')
  async createMaterial(
    @Req() req: any,
    @Body()
    body: {
      branch_id?: string;
      class_id?: string;
      session_id?: string;
      lesson_plan_id?: string;
      type: materials_type;
      title: string;
      body?: string;
      file_id?: string;
      url?: string;
      copyright_source?: files_copyright_source;
    },
  ) {
    return this.curriculumService.createMaterial(body, req.user.id);
  }

  /**
   * TC-070: Student only sees materials in enrolled class (403 for other classes)
   */
  @Get('materials/class/:classId')
  async getClassMaterials(@Req() req: any, @Param('classId') classId: string) {
    return this.curriculumService.getClassMaterials(classId, req.user);
  }

  /**
   * TC-071: Materials with third_party copyright are blocked from AI generation
   */
  @Post('materials/:id/ai-generate')
  async generateAiFromMaterial(@Req() req: any, @Param('id') id: string) {
    return this.curriculumService.generateAiFromMaterial(id, req.user.id);
  }
}
