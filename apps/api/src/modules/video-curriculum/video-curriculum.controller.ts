import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  VideoCurriculumService,
  CompareStandardsDto,
  DecideSuggestionDto,
  GenerateVideoScriptDto,
} from './video-curriculum.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@corelink/shared';

@Controller('video-curriculum')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoCurriculumController {
  constructor(private readonly videoCurriculumService: VideoCurriculumService) {}

  // =========================================================================
  // 1. ĐỐI SOÁT KHUNG CHUẨN & DUYỆT ĐỀ XUẤT (TC-074)
  // =========================================================================

  @Post('standards/compare')
  @Roles(RoleCode.ACADEMIC, RoleCode.TEACHER, RoleCode.ADMIN)
  async compareWithStandards(@Req() req: any, @Body() body: CompareStandardsDto) {
    return this.videoCurriculumService.compareWithStandards(body, req.user.id);
  }

  @Post('suggestions/:id/decide')
  @Roles(RoleCode.ACADEMIC, RoleCode.ADMIN)
  async decideSuggestion(
    @Req() req: any,
    @Param('id') suggestionId: string,
    @Body() body: DecideSuggestionDto,
  ) {
    return this.videoCurriculumService.decideSuggestion(
      suggestionId,
      body,
      req.user.id,
    );
  }

  // =========================================================================
  // 2. VIDEO BÀI GIẢNG AI & DUYỆT KỊCH BẢN (TC-075)
  // =========================================================================

  @Post('videos/generate-script')
  @Roles(RoleCode.TEACHER, RoleCode.ACADEMIC, RoleCode.ADMIN)
  async generateVideoScript(@Req() req: any, @Body() body: GenerateVideoScriptDto) {
    return this.videoCurriculumService.generateVideoScript(body, req.user.id);
  }

  @Post('videos/:id/approve-script')
  @Roles(RoleCode.ACADEMIC, RoleCode.TEACHER, RoleCode.ADMIN)
  async approveVideoScript(@Req() req: any, @Param('id') videoId: string) {
    return this.videoCurriculumService.approveVideoScript(videoId, req.user.id);
  }

  @Post('videos/:id/render')
  @Roles(RoleCode.TEACHER, RoleCode.ACADEMIC, RoleCode.ADMIN)
  async startVideoRender(@Req() req: any, @Param('id') videoId: string) {
    return this.videoCurriculumService.startVideoRender(videoId, req.user.id);
  }
}
