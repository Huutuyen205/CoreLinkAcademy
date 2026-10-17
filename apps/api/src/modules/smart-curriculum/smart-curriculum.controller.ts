import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  SmartCurriculumService,
  ParseCurriculumDto,
  UpdateCurriculumNodeDto,
  GenerateMaterialsDto,
} from './smart-curriculum.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@corelink/shared';

@Controller('smart-curriculum')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmartCurriculumController {
  constructor(private readonly smartCurriculumService: SmartCurriculumService) {}

  // =========================================================================
  // 1. AI TÁCH CẤU TRÚC GIÁO TRÌNH KÈM TRANG NGUỒN (TC-072)
  // =========================================================================

  @Post('parse-structure')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async parseCurriculumStructure(@Req() req: any, @Body() body: ParseCurriculumDto) {
    return this.smartCurriculumService.parseCurriculumStructure(body, req.user.id);
  }

  @Put('nodes/:id')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async updateCurriculumNode(
    @Param('id') nodeId: string,
    @Body() body: UpdateCurriculumNodeDto,
  ) {
    return this.smartCurriculumService.updateCurriculumNode(nodeId, body);
  }

  @Get('roadmap/:versionId')
  async getCurriculumRoadmap(@Param('versionId') versionId: string) {
    return this.smartCurriculumService.getCurriculumRoadmap(versionId);
  }

  // =========================================================================
  // 2. AI TẠO HỌC LIỆU NHÁP TỪ GIÁO ÁN ĐÃ DUYỆT (TC-073)
  // =========================================================================

  @Post('generate-materials')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async generateMaterialsFromLessonPlan(
    @Req() req: any,
    @Body() body: GenerateMaterialsDto,
  ) {
    return this.smartCurriculumService.generateMaterialsFromLessonPlan(body, req.user.id);
  }

  @Post('materials/:id/publish')
  @Roles(RoleCode.TEACHER, RoleCode.ADMIN, RoleCode.ACADEMIC)
  async publishAiMaterial(@Req() req: any, @Param('id') materialId: string) {
    return this.smartCurriculumService.publishAiMaterial(materialId, req.user.id);
  }

  @Get('materials/class/:classId')
  async getClassMaterials(@Req() req: any, @Param('classId') classId: string) {
    return this.smartCurriculumService.getClassMaterials(classId, req.user);
  }
}
