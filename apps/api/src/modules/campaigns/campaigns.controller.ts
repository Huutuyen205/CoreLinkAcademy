import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ScopeGuard } from '../auth/guards/scope.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleCode, CreateCampaignRequest } from '@corelink/shared';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC, RoleCode.CONSULTANT)
  @ApiOperation({ summary: 'Tạo chiến dịch marketing mới kèm UTM, mã giảm giá (FR-107, TC-021)' })
  async create(@Body() dto: CreateCampaignRequest, @Req() req: any) {
    const actorId = req.user?.id;
    return this.campaignsService.create(dto, actorId);
  }

  @Get()
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC, RoleCode.CONSULTANT)
  @ApiOperation({ summary: 'Danh sách chiến dịch marketing kèm CAC, ROI (FR-107, S37, TC-021)' })
  async findAll() {
    return this.campaignsService.findAll();
  }

  @Get('referral-stats')
  @Roles(RoleCode.GUARDIAN, RoleCode.ADMIN)
  @ApiOperation({ summary: 'Thống kê mã giới thiệu và phần thưởng dành cho Phụ huynh (FR-107, S25)' })
  async getGuardianReferralStats(@Req() req: any) {
    const userId = req.user?.id;
    return this.campaignsService.getGuardianReferralStats(userId);
  }
}
