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
  AiAssistantService,
  AskAssistantDto,
} from './ai-assistant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@corelink/shared';

@Controller('ai-assistant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  // =========================================================================
  // 1. CHỈ SỐ ĐÁNG GIÁ GIÁO VIÊN & BẢO MẬT PHỤ HUYNH (FR-1302 / TC-140)
  // =========================================================================

  @Get('teacher-metrics/:teacherId')
  @Roles(
    RoleCode.GUARDIAN,
    RoleCode.TEACHER,
    RoleCode.ACADEMIC,
    RoleCode.ADMIN,
  )
  async getTeacherMetrics(
    @Req() req: any,
    @Param('teacherId') teacherId: string,
    @Query('month') month?: string,
  ) {
    return this.aiAssistantService.getTeacherMetrics(
      teacherId,
      req.user.id,
      req.user.roles || [],
      month,
    );
  }

  // =========================================================================
  // 2. TRỢ LÝ ĐIỀU HÀNH AI CHỈ ĐỌC (FR-1204 / AI-14 / TC-137)
  // =========================================================================

  @Post('ask')
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC)
  async askExecutiveAssistant(@Req() req: any, @Body() body: AskAssistantDto) {
    return this.aiAssistantService.askExecutiveAssistant(body, req.user.id);
  }

  // =========================================================================
  // 3. CẢNH BÁO SỚM HỌC SINH CÓ NGUY CƠ TỤT ĐIỂM / BỎ HỌC (FR-705 / AI-10)
  // =========================================================================

  @Get('early-warnings')
  @Roles(
    RoleCode.ACADEMIC,
    RoleCode.TEACHER,
    RoleCode.ADMIN,
  )
  async getEarlyWarnings(@Query('branchId') branchId?: string) {
    return this.aiAssistantService.getEarlyWarnings(branchId);
  }

  // =========================================================================
  // 4. GỢI Ý XẾP LỚP & PHÂN CÔNG GIÁO VIÊN (FR-307 / AI-11)
  // =========================================================================

  @Get('placement-suggestions')
  @Roles(RoleCode.ACADEMIC, RoleCode.ADMIN)
  async getPlacementSuggestions(@Query('branchId') branchId?: string) {
    return this.aiAssistantService.getPlacementSuggestions(branchId);
  }

  @Post('placement-suggestions/:id/apply')
  @Roles(RoleCode.ADMIN)
  async applyPlacementSuggestion(
    @Req() req: any,
    @Param('id') suggestionId: string,
  ) {
    return this.aiAssistantService.applyPlacementSuggestion(
      suggestionId,
      req.user.id,
    );
  }
}
