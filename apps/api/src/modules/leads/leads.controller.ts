import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ScopeGuard } from '../auth/guards/scope.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode } from '@corelink/shared';
import { UpdateLeadStatusRequest, ConvertLeadRequest } from '@corelink/shared';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('funnel')
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC, RoleCode.CONSULTANT)
  @ApiOperation({ summary: 'Báo cáo phễu chuyển đổi tuyển sinh (FR-108, S37, TC-022)' })
  async getFunnelReport(@Query('month') month?: string) {
    return this.leadsService.getFunnelReport(month);
  }

  @Get()
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC, RoleCode.CONSULTANT)
  @ApiOperation({ summary: 'Danh sách khách tiềm năng (Kanban - FR-105, S35, TC-018)' })
  async findAll(
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.leadsService.findAll({ status, source, ownerId });
  }

  @Patch(':id/status')
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC, RoleCode.CONSULTANT)
  @ApiOperation({ summary: 'Cập nhật trạng thái khách tiềm năng (FR-105, TC-017, TC-019)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusRequest,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    return this.leadsService.updateStatus(id, dto, actorId);
  }

  @Post(':id/activities')
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC, RoleCode.CONSULTANT)
  @ApiOperation({ summary: 'Ghi lại hoạt động tương tác với khách (FR-105, TC-017)' })
  async createActivity(
    @Param('id') id: string,
    @Body() body: { type: string; content: string; remindAt?: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    const remindAt = body.remindAt ? new Date(body.remindAt) : undefined;
    return this.leadsService.createActivity(id, body.type, body.content, actorId, remindAt);
  }

  @Post(':id/convert')
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC, RoleCode.CONSULTANT)
  @ApiOperation({ summary: 'Chuyển khách tiềm năng thành học viên chính thức trong 1 transaction (FR-106, TC-020)' })
  async convertLead(
    @Param('id') id: string,
    @Body() dto: ConvertLeadRequest,
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    return this.leadsService.convertLead(id, dto, actorId);
  }
}
