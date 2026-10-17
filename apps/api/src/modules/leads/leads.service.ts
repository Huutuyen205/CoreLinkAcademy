import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import {
  UpdateLeadStatusRequest,
  ConvertLeadRequest,
  RoleCode,
  UserStatus,
} from '@corelink/shared';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Danh sách khách tiềm năng kèm cảnh báo quá 24h chưa liên hệ (FR-105, S35, TC-018)
   */
  async findAll(query: { status?: string; source?: string; ownerId?: string }) {
    const where: any = { deleted_at: null };
    if (query.status) where.status = query.status;
    if (query.source) where.source = query.source;
    if (query.ownerId) where.owner_id = query.ownerId;

    const leads = await this.prisma.leads.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        campaigns: true,
        guardians: {
          include: { users: { select: { full_name: true } } },
        },
        users: { select: { full_name: true, email: true } },
        lead_activities: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
      },
    });

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return leads.map((l) => {
      const isOverdue =
        l.status === 'new' &&
        !l.first_contacted_at &&
        now - new Date(l.created_at).getTime() > oneDayMs;

      return {
        id: l.id,
        parentName: l.parent_name,
        phone: l.phone,
        childName: l.child_name,
        childAge: l.child_age,
        childGrade: l.child_grade,
        goal: l.goal,
        freeSlots: l.free_slots,
        source: l.source,
        utmSource: l.utm_source,
        utmCampaign: l.utm_campaign,
        status: l.status,
        lostReason: l.lost_reason,
        ownerId: l.owner_id,
        ownerName: l.users?.full_name,
        firstContactedAt: l.first_contacted_at,
        isOverdue24h: isOverdue,
        campaignName: l.campaigns?.name,
        referredByName: l.guardians?.users.full_name,
        convertedStudentId: l.converted_student_id,
        createdAt: l.created_at,
        recentActivities: l.lead_activities,
      };
    });
  }

  /**
   * Cập nhật trạng thái khách tiềm năng (Kanban kéo thả - FR-105, TC-017, TC-019)
   */
  async updateStatus(id: string, dto: UpdateLeadStatusRequest, actorId?: string) {
    const lead = await this.prisma.leads.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException('Không tìm thấy khách tiềm năng');
    }

    // TC-019: Bắt buộc có lý do khi chuyển sang trạng thái "Không nhập học" (lost)
    if (dto.status === 'lost' && (!dto.lostReason || dto.lostReason.trim().length === 0)) {
      throw new BadRequestException('Chuyển sang trạng thái Không nhập học bắt buộc phải chọn lý do (FR-105)');
    }

    const isFirstContact = lead.status === 'new' && dto.status !== 'new' && !lead.first_contacted_at;
    const firstContactedAt = isFirstContact ? new Date() : lead.first_contacted_at;

    const updated = await this.prisma.leads.update({
      where: { id },
      data: {
        status: dto.status,
        lost_reason: dto.status === 'lost' ? dto.lostReason : null,
        owner_id: dto.ownerId !== undefined ? dto.ownerId : lead.owner_id,
        first_contacted_at: firstContactedAt,
      },
    });

    // Ghi nhận lịch sử hoạt động chuyển trạng thái (TC-017)
    await this.prisma.lead_activities.create({
      data: {
        lead_id: id,
        actor_id: actorId,
        type: 'status_change',
        from_status: lead.status,
        to_status: dto.status,
        content: dto.status === 'lost' ? `Lý do: ${dto.lostReason}` : `Chuyển trạng thái từ ${lead.status} sang ${dto.status}`,
      },
    });

    return updated;
  }

  /**
   * Thêm hoạt động tương tác với khách (FR-105)
   */
  async createActivity(leadId: string, type: string, content: string, actorId?: string, remindAt?: Date) {
    return this.prisma.lead_activities.create({
      data: {
        lead_id: leadId,
        actor_id: actorId,
        type: (type as any) || 'note',
        content,
        remind_at: remindAt,
      },
    });
  }

  /**
   * Chuyển khách tiềm năng thành học viên trong 1 transaction (FR-106, TC-020)
   */
  async convertLead(id: string, dto: ConvertLeadRequest, actorId?: string) {
    const lead = await this.prisma.leads.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException('Không tìm thấy khách tiềm năng');
    }

    if (lead.status === 'enrolled' || lead.converted_student_id) {
      throw new BadRequestException('Khách này đã được chuyển thành học viên trước đó');
    }

    const targetClass = await this.prisma.classes.findUnique({
      where: { id: dto.classId },
      include: { programs: true },
    });
    if (!targetClass) {
      throw new NotFoundException('Không tìm thấy lớp học');
    }

    const defaultBranch = await this.prisma.branches.findFirst({ where: { is_active: true } });
    const branchId = lead.branch_id || defaultBranch!.id;

    // Password khởi tạo mặc định
    const defaultPassword = 'CL@' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const passwordHash = await argon2.hash(defaultPassword, { type: argon2.argon2id });

    // Lấy các vai trò
    const studentRole = await this.prisma.roles.findUnique({ where: { code: 'student' } });
    const guardianRole = await this.prisma.roles.findUnique({ where: { code: 'guardian' } });

    // TRANSACTION TOÀN BỘ (FR-106)
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Tạo tài khoản Học sinh
      const studentCode = `HS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const studentUser = await tx.users.create({
        data: {
          branch_id: branchId,
          full_name: lead.child_name || `Học sinh ${lead.parent_name || 'Mới'}`,
          username: studentCode,
          password_hash: passwordHash,
          must_change_password: true,
          status: UserStatus.ACTIVE,
        },
      });

      if (studentRole) {
        await tx.user_roles.create({
          data: {
            user_id: studentUser.id,
            role_id: studentRole.id,
            granted_by: actorId,
          },
        });
      }

      const isYoung = (lead.child_grade !== null && lead.child_grade < 6) || false;
      const student = await tx.students.create({
        data: {
          user_id: studentUser.id,
          branch_id: branchId,
          code: studentCode,
          grade_level: lead.child_grade,
          goal: lead.goal,
          is_young_account: isYoung,
          status: 'active',
          source_lead_id: lead.id,
        },
      });

      // 2. Tạo tài khoản Phụ huynh
      let guardianRecord: any = null;
      let existingGuardianUser = await tx.users.findUnique({ where: { phone: lead.phone } });

      if (!existingGuardianUser) {
        existingGuardianUser = await tx.users.create({
          data: {
            branch_id: branchId,
            full_name: lead.parent_name || 'Phụ huynh',
            phone: lead.phone,
            password_hash: passwordHash,
            must_change_password: true,
            status: UserStatus.ACTIVE,
          },
        });

        if (guardianRole) {
          await tx.user_roles.create({
            data: {
              user_id: existingGuardianUser.id,
              role_id: guardianRole.id,
              granted_by: actorId,
            },
          });
        }
      }

      const refCode = 'REF-' + crypto.randomBytes(3).toString('hex').toUpperCase();
      guardianRecord = await tx.guardians.upsert({
        where: { user_id: existingGuardianUser.id },
        update: {},
        create: {
          user_id: existingGuardianUser.id,
          branch_id: branchId,
          referral_code: refCode,
        },
      });

      // 3. Liên kết Guardianships
      await tx.guardianships.create({
        data: {
          student_id: student.id,
          guardian_id: guardianRecord.id,
          relation: 'guardian',
          can_view_results: true,
          can_message: true,
          receives_fee_notice: true,
        },
      });

      // 4. Ghi danh vào lớp (Enrollments)
      const enrollment = await tx.enrollments.create({
        data: {
          branch_id: branchId,
          class_id: targetClass.id,
          student_id: student.id,
          status: 'active',
          enrolled_on: new Date(),
          fee_plan_id: dto.feePlanId || targetClass.programs.default_fee_plan_id,
          created_by: actorId || studentUser.id,
        },
      });

      // 5. Lập khoản phải thu ban đầu (Invoices) nếu có fee plan
      const feePlanId = dto.feePlanId || targetClass.programs.default_fee_plan_id;
      let invoice: any = null;
      if (feePlanId) {
        const plan = await tx.fee_plans.findUnique({ where: { id: feePlanId } });
        if (plan) {
          const discount = dto.discountVnd || 0;
          invoice = await tx.invoices.create({
            data: {
              branch_id: branchId,
              student_id: student.id,
              enrollment_id: enrollment.id,
              fee_plan_id: plan.id,
              description: `Học phí khóa ${targetClass.name}`,
              amount_vnd: plan.amount_vnd,
              discount_vnd: discount,
              discount_reason: dto.discountReason || 'Ưu đãi nhập học',
              due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 ngày
              status: 'unpaid',
              created_by: actorId || studentUser.id,
            },
          });
        }
      }

      // 6. Cập nhật trạng thái Lead thành 'enrolled'
      await tx.leads.update({
        where: { id: lead.id },
        data: {
          status: 'enrolled',
          converted_student_id: student.id,
        },
      });

      // 7. Ghi hoạt động chuyển đổi
      await tx.lead_activities.create({
        data: {
          lead_id: lead.id,
          actor_id: actorId,
          type: 'status_change',
          from_status: lead.status,
          to_status: 'enrolled',
          content: `Chuyển thành học viên thành công! Lớp: ${targetClass.name} | Mã HS: ${student.code}`,
        },
      });

      // 8. Ghi nhật ký audit
      await tx.audit_logs.create({
        data: {
          branch_id: branchId,
          actor_id: actorId,
          action: 'lead.convert',
          entity: 'leads',
          entity_id: lead.id,
          after_data: {
            studentId: student.id,
            guardianId: guardianRecord.id,
            classId: targetClass.id,
            invoiceId: invoice?.id,
          },
          reason: 'Chuyển đổi khách tiềm năng thành học viên chính thức',
        },
      });

      return {
        student,
        studentUser,
        guardian: guardianRecord,
        enrollment,
        invoice,
        tempPassword: defaultPassword,
      };
    });

    return {
      message: 'Chuyển thành học viên thành công!',
      studentId: result.student.id,
      studentCode: result.student.code,
      guardianId: result.guardian.id,
      enrollmentId: result.enrollment.id,
      invoiceId: result.invoice?.id,
      tempPassword: result.tempPassword,
    };
  }

  /**
   * Báo cáo phễu chuyển đổi từ view v_lead_funnel_month (FR-108, S37, TC-022)
   */
  async getFunnelReport(month?: string) {
    const rawMonth = month || new Date().toISOString().slice(0, 7);
    const funnel = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM v_lead_funnel_month WHERE lead_month = ?`,
      rawMonth,
    );
    return funnel.map((row) => {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(row)) {
        sanitized[key] = typeof val === 'bigint' ? Number(val) : val;
      }
      return sanitized;
    });
  }
}
