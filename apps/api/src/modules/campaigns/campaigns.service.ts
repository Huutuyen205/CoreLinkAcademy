import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignRequest } from '@corelink/shared';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo chiến dịch marketing kèm mã UTM, mã giảm giá (FR-107, TC-021)
   */
  async create(dto: CreateCampaignRequest, actorId?: string) {
    const defaultBranch = await this.prisma.branches.findFirst({ where: { is_active: true } });
    if (!defaultBranch) {
      throw new BadRequestException('Chưa cấu hình cơ sở hoạt động');
    }

    // Kiểm tra trùng mã giảm giá nếu có
    if (dto.discountCode) {
      const existing = await this.prisma.campaigns.findUnique({
        where: { discount_code: dto.discountCode },
      });
      if (existing) {
        throw new BadRequestException(`Mã ưu đãi ${dto.discountCode} đã tồn tại`);
      }
    }

    const campaign = await this.prisma.campaigns.create({
      data: {
        branch_id: defaultBranch.id,
        name: dto.name,
        utm_campaign: dto.utmCampaign || `camp_${Date.now()}`,
        channel: dto.channel || 'facebook',
        cost_vnd: BigInt(dto.costVnd || 0),
        discount_code: dto.discountCode,
        discount_percent: dto.discountPercent,
        starts_on: dto.startsOn ? new Date(dto.startsOn) : null,
        ends_on: dto.endsOn ? new Date(dto.endsOn) : null,
      },
    });

    return {
      ...campaign,
      cost_vnd: Number(campaign.cost_vnd),
    };
  }

  /**
   * Danh sách chiến dịch kèm chỉ số chuyển đổi, CAC và ROI (FR-107, S37, TC-021)
   */
  async findAll() {
    const campaigns = await this.prisma.campaigns.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        leads: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    return campaigns.map((c) => {
      const totalLeads = c.leads.length;
      const enrolledCount = c.leads.filter((l) => l.status === 'enrolled').length;
      const costVnd = Number(c.cost_vnd);
      const conversionRate = totalLeads > 0 ? (enrolledCount / totalLeads) * 100 : 0;
      const cacVnd = enrolledCount > 0 ? Math.round(costVnd / enrolledCount) : costVnd;

      return {
        id: c.id,
        name: c.name,
        utmCampaign: c.utm_campaign,
        channel: c.channel,
        costVnd,
        discountCode: c.discount_code,
        discountPercent: c.discount_percent ? Number(c.discount_percent) : 0,
        startsOn: c.starts_on,
        endsOn: c.ends_on,
        totalLeads,
        enrolledCount,
        conversionRate: Math.round(conversionRate * 10) / 10,
        cacVnd,
        createdAt: c.created_at,
      };
    });
  }

  /**
   * Thống kê chương trình giới thiệu dành cho Phụ huynh (S25, FR-107)
   */
  async getGuardianReferralStats(userId: string) {
    const guardian = await this.prisma.guardians.findUnique({
      where: { user_id: userId },
    });

    if (!guardian) {
      throw new NotFoundException('Không tìm thấy thông tin phụ huynh');
    }

    // Tìm các leads được giới thiệu bởi phụ huynh này
    const referredLeads = await this.prisma.leads.findMany({
      where: { referred_by_guardian_id: guardian.id },
      select: {
        id: true,
        parent_name: true,
        child_name: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const enrolledCount = referredLeads.filter((l) => l.status === 'enrolled').length;
    // Mỗi lượt nhập học thành công tặng 500,000 VND học bổng
    const rewardPerEnrollmentVnd = 500000;
    const totalRewardVnd = enrolledCount * rewardPerEnrollmentVnd;

    return {
      referralCode: guardian.referral_code,
      totalReferred: referredLeads.length,
      enrolledCount,
      totalRewardVnd,
      referredLeads,
    };
  }
}
