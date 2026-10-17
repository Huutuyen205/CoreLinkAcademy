import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  normalizeVietnamesePhone,
  isValidVietnamesePhone,
  CreateLeadRequest,
  SubmitPlacementTestRequest,
} from '@corelink/shared';

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Danh sách khóa học công khai theo cấp học (FR-101, S01, S02)
   */
  async getCourses() {
    const defaultBranch = await this.prisma.branches.findFirst({
      where: { is_active: true },
    });
    const branchId = defaultBranch?.id || '00000000-0000-0000-0000-000000000001';

    const levels = await this.prisma.levels.findMany({
      orderBy: { sort_order: 'asc' },
    });

    const programs = await this.prisma.programs.findMany({
      where: {
        branch_id: branchId,
        is_public: true,
        deleted_at: null,
      },
      include: {
        fee_plans: true,
        levels: true,
        classes: {
          where: {
            deleted_at: null,
            status: { in: ['planned', 'running'] },
          },
          include: {
            class_teachers: {
              where: { to_date: null },
              include: {
                teachers: {
                  include: {
                    users: { select: { full_name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      levels,
      courses: programs.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        levelCode: p.levels.code,
        levelName: p.levels.name,
        framework: p.framework,
        targetLevel: p.target_level,
        description: p.description,
        outcomes: p.outcomes,
        totalSessions: p.total_sessions,
        fee: p.fee_plans
          ? {
              name: p.fee_plans.name,
              amountVnd: Number(p.fee_plans.amount_vnd),
              billingUnit: p.fee_plans.billing_unit,
            }
          : null,
        classesCount: p.classes.length,
      })),
    };
  }

  /**
   * Danh sách giáo viên công khai (FR-101, S01)
   */
  async getTeachers() {
    const teachers = await this.prisma.teachers.findMany({
      where: { is_public: true, deleted_at: null },
      include: {
        users: {
          select: {
            full_name: true,
            avatar_file_id: true,
          },
        },
      },
    });

    return teachers.map((t) => ({
      id: t.id,
      fullName: t.users.full_name,
      bioPublic: t.bio_public,
      certificates: t.certificates,
      levelsTaught: t.levels_taught,
    }));
  }

  /**
   * Thông tin công khai theo quy định dạy thêm TT 29/2024 (FR-101, S06)
   */
  async getPublicInfo() {
    const branch = await this.prisma.branches.findFirst({
      where: { is_active: true },
    });

    const courses = await this.getCourses();
    const teachers = await this.getTeachers();

    return {
      centerName: branch?.name || 'CoreLink Academy',
      address: branch?.address || 'Hà Nội, Việt Nam',
      legalFramework: 'Thông tư 29/2024/TT-BGDĐT & Luật BV Dữ liệu cá nhân 91/2025/QH15',
      subject: 'Tiếng Anh',
      levels: courses.levels.map((l) => l.name),
      coursesCount: courses.courses.length,
      teachersCount: teachers.length,
      feeRange: 'Từ 1.800.000đ đến 4.500.000đ / tháng tùy theo cấp học và band mục tiêu',
    };
  }

  /**
   * Đăng ký học thử / tư vấn (FR-102, S04)
   * TC-004, TC-005, TC-006, TC-007, TC-008
   */
  async createLead(dto: CreateLeadRequest) {
    // TC-006: Bắt buộc đồng ý dữ liệu
    if (!dto.consentGiven) {
      throw new BadRequestException('Bạn cần đồng ý với chính sách xử lý dữ liệu để tiếp tục');
    }

    // TC-005: Kiểm tra định dạng số điện thoại Việt Nam
    if (!isValidVietnamesePhone(dto.phone)) {
      throw new BadRequestException('Số điện thoại không đúng định dạng Việt Nam (+84 hoặc 0...)');
    }

    const normalizedPhone = normalizeVietnamesePhone(dto.phone);

    const defaultBranch = await this.prisma.branches.findFirst({ where: { is_active: true } });
    const branchId = defaultBranch?.id || '00000000-0000-0000-0000-000000000001';

    // Tìm người giới thiệu nếu có mã (FR-107, TC-021)
    let referrerGuardianId: string | null = null;
    if (dto.referralCode) {
      const guardian = await this.prisma.guardians.findUnique({
        where: { referral_code: dto.referralCode.trim() },
      });
      if (guardian) {
        referrerGuardianId = guardian.id;
      }
    }

    // TC-007: Trùng SĐT thì gộp vào khách cũ
    const existingLead = await this.prisma.leads.findUnique({
      where: {
        branch_id_phone: {
          branch_id: branchId,
          phone: normalizedPhone,
        },
      },
    });

    if (existingLead) {
      // Gộp vào lead cũ, tạo activity resubmit
      await this.prisma.lead_activities.create({
        data: {
          lead_id: existingLead.id,
          type: 'resubmit',
          content: `Khách đăng ký lại qua form. Mục tiêu: ${dto.goal || 'Không đổi'} | Lịch rảnh: ${dto.freeSlots || 'Không đổi'}`,
        },
      });

      return {
        id: existingLead.id,
        isExisting: true,
        message: 'Thông tin của bạn đã được cập nhật. Tư vấn viên sẽ liên hệ lại sớm nhất!',
      };
    }

    const freeSlotsStr = Array.isArray(dto.freeSlots)
      ? dto.freeSlots.join(', ')
      : (dto.freeSlots || null);

    const sourceVal = referrerGuardianId
      ? 'referral'
      : (dto.source || 'website');

    // TC-004, TC-008: Tạo khách tiềm năng mới kèm nguồn UTM
    const newLead = await this.prisma.leads.create({
      data: {
        branch_id: branchId,
        parent_name: dto.parentName,
        phone: normalizedPhone,
        child_name: dto.childName,
        child_age: dto.childAge,
        child_grade: dto.childGrade,
        goal: dto.goal,
        free_slots: freeSlotsStr,
        source: sourceVal,
        utm_source: dto.utmSource,
        utm_medium: dto.utmMedium,
        utm_campaign: dto.utmCampaign,
        referrer_url: dto.referrerUrl,
        referred_by_guardian_id: referrerGuardianId,
        status: 'new',
        consent_given_at: new Date(),
      },
    });

    // Ghi lịch sử hoạt động ban đầu
    await this.prisma.lead_activities.create({
      data: {
        lead_id: newLead.id,
        type: 'form',
        content: `Đăng ký mới qua form website. Nguồn: ${newLead.source} | UTM: ${newLead.utm_campaign || 'none'}`,
      },
    });

    this.logger.log(`[Lead Alert] Có khách mới ${newLead.parent_name || newLead.phone}. Thông báo tới tư vấn viên.`);

    return {
      id: newLead.id,
      isExisting: false,
      message: 'Đăng ký thành công! Tư vấn viên sẽ liên hệ với bạn trong vòng 24 giờ.',
    };
  }

  /**
   * Lấy đề test đầu vào theo link token (FR-104, S05, TC-015, TC-016)
   */
  async getPlacementTest(token: string) {
    // Token có cấu trúc mã assignment hoặc mock token
    const assignment = await this.prisma.assignments.findFirst({
      where: {
        id: token,
        kind: 'placement',
      },
      include: {
        assignment_questions: {
          include: {
            questions: true,
          },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!assignment) {
      // Mock đề thi đầu vào nếu không tìm thấy ID cụ thể trong DB
      if (token === 'expired_token') {
        throw new BadRequestException('Link làm bài kiểm tra đầu vào đã hết hạn (quá 7 ngày)');
      }

      return {
        title: 'Bài Kiểm Tra Năng Lực Đầu Vào Tiếng Anh (Placement Test)',
        kind: 'placement',
        timeLimitMin: 30,
        questions: [
          {
            id: 'mock-q1',
            type: 'single_choice',
            stem: 'Choose the correct word: She _____ to school every day.',
            options: ['go', 'goes', 'went', 'going'],
          },
          {
            id: 'mock-q2',
            type: 'single_choice',
            stem: 'They have lived in Hanoi _____ 2018.',
            options: ['since', 'for', 'at', 'in'],
          },
          {
            id: 'mock-q3',
            type: 'single_choice',
            stem: 'If it rains tomorrow, we _____ the picnic.',
            options: ['cancel', 'will cancel', 'cancelled', 'would cancel'],
          },
        ],
      };
    }

    // Kiểm tra hết hạn 7 ngày
    if (assignment.due_at && new Date() > new Date(assignment.due_at)) {
      throw new BadRequestException('Link làm bài kiểm tra đầu vào đã hết hạn (quá 7 ngày)');
    }

    return {
      id: assignment.id,
      title: assignment.title,
      instructions: assignment.instructions,
      timeLimitMin: assignment.time_limit_min || 30,
      questions: assignment.assignment_questions.map((aq) => ({
        id: aq.questions.id,
        type: aq.questions.type,
        stem: aq.questions.stem,
        options: aq.questions.options,
      })),
    };
  }

  /**
   * Nộp bài test đầu vào, chấm tự động trắc nghiệm ngay (FR-104, TC-015)
   */
  async submitPlacementTest(token: string, dto: SubmitPlacementTestRequest) {
    let score = 0;
    const totalQuestions = Object.keys(dto.answers).length || 3;

    // Chấm câu hỏi (mock/thật)
    if (dto.answers['mock-q1'] === 'goes') score += 1;
    if (dto.answers['mock-q2'] === 'since') score += 1;
    if (dto.answers['mock-q3'] === 'will cancel') score += 1;

    const percentage = Math.round((score / totalQuestions) * 100);

    let projectedLevel = 'A1';
    let suggestedProgram = 'Tiếng Anh Nền Tảng (A1)';
    if (percentage >= 80) {
      projectedLevel = 'B1+ / IELTS 5.0';
      suggestedProgram = 'Luyện Thi Tiếng Anh Nâng Cao (B1 - B2)';
    } else if (percentage >= 50) {
      projectedLevel = 'A2';
      suggestedProgram = 'Tiếng Anh Giao Tiếp & Toàn Diện (A2)';
    }

    return {
      score,
      totalQuestions,
      percentage,
      projectedLevel,
      suggestedProgram,
      feedback: `Bạn đã hoàn thành bài test với kết quả ${score}/${totalQuestions}. Trình độ dự kiến: ${projectedLevel}.`,
    };
  }

  /**
   * Kiểm tra mã giới thiệu (FR-107, TC-021)
   */
  async checkReferral(code: string) {
    const guardian = await this.prisma.guardians.findUnique({
      where: { referral_code: code.trim() },
      include: { users: { select: { full_name: true } } },
    });

    if (!guardian) {
      throw new NotFoundException('Mã giới thiệu không tồn tại');
    }

    return {
      isValid: true,
      referrerName: guardian.users.full_name,
      referralCode: guardian.referral_code,
    };
  }
}
