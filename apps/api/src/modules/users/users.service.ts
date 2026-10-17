import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import {
  normalizeVietnamesePhone,
  RoleCode,
  UserStatus,
  CreateUserRequest,
  UpdateGuardianshipRequest,
} from '@corelink/shared';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo tài khoản mới kèm mật khẩu tạm 72h và hồ sơ theo vai trò (FR-201, FR-208)
   */
  async createUser(dto: CreateUserRequest, creatorId?: string) {
    const defaultBranch = await this.prisma.branches.findFirst({
      where: { is_active: true },
    });
    const branchId = dto.branchId || defaultBranch?.id || '00000000-0000-0000-0000-000000000001';

    // Chuẩn hóa số điện thoại
    const phone = dto.phone ? normalizeVietnamesePhone(dto.phone) : null;

    // Kiểm tra trùng phone, email, username
    if (phone) {
      const existingPhone = await this.prisma.users.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã được đăng ký trong hệ thống');
      }
    }
    if (dto.email) {
      const existingEmail = await this.prisma.users.findUnique({ where: { email: dto.email } });
      if (existingEmail) {
        throw new ConflictException('Email đã được đăng ký trong hệ thống');
      }
    }
    if (dto.username) {
      const existingUsername = await this.prisma.users.findUnique({ where: { username: dto.username } });
      if (existingUsername) {
        throw new ConflictException('Mã người dùng/username đã tồn tại');
      }
    }

    // Sinh mật khẩu tạm ngẫu nhiên 8 ký tự
    const tempPassword = 'CL@' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

    // Hạn mật khẩu tạm 72 giờ
    const tempPasswordExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    // Giao dịch tạo user + vai trò + hồ sơ chuyên biệt
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          branch_id: branchId,
          full_name: dto.fullName,
          phone,
          email: dto.email || null,
          username: dto.username || null,
          password_hash: passwordHash,
          must_change_password: true,
          temp_password_expires_at: tempPasswordExpiresAt,
          status: UserStatus.ACTIVE,
        },
      });

      // Gán vai trò
      const roleRecord = await tx.roles.findUnique({ where: { code: dto.role } });
      if (roleRecord) {
        await tx.user_roles.create({
          data: {
            user_id: user.id,
            role_id: roleRecord.id,
            granted_by: creatorId,
          },
        });
      }

      // Tạo hồ sơ theo vai trò
      let studentRecord: any = null;
      let teacherRecord: any = null;
      let guardianRecord: any = null;

      if (dto.role === RoleCode.STUDENT) {
        const studentCode =
          dto.username ||
          `HS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // FR-208: Học sinh dưới lớp 6 là tài khoản nhỏ (is_young_account=1)
        const isYoung = (dto.gradeLevel !== undefined && dto.gradeLevel < 6) || false;

        studentRecord = await tx.students.create({
          data: {
            user_id: user.id,
            branch_id: branchId,
            code: studentCode,
            date_of_birth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
            school_name: dto.schoolName,
            grade_level: dto.gradeLevel,
            goal: dto.goal,
            is_young_account: isYoung,
            status: 'active',
          },
        });
      } else if (dto.role === RoleCode.TEACHER) {
        teacherRecord = await tx.teachers.create({
          data: {
            user_id: user.id,
            branch_id: branchId,
            other_workplace: dto.otherWorkplace,
            is_public: true,
          },
        });
      } else if (dto.role === RoleCode.GUARDIAN) {
        const refCode = 'REF-' + crypto.randomBytes(3).toString('hex').toUpperCase();
        guardianRecord = await tx.guardians.create({
          data: {
            user_id: user.id,
            branch_id: branchId,
            referral_code: refCode,
          },
        });
      }

      // Ghi audit_logs (FR-1501)
      await tx.audit_logs.create({
        data: {
          branch_id: branchId,
          actor_id: creatorId,
          action: 'user.create',
          entity: 'users',
          entity_id: user.id,
          after_data: {
            fullName: user.full_name,
            role: dto.role,
            phone: user.phone,
            email: user.email,
          },
          reason: 'Tạo tài khoản mới bởi quản trị viên',
        },
      });

      return {
        user,
        tempPassword,
        student: studentRecord,
        teacher: teacherRecord,
        guardian: guardianRecord,
      };
    });

    return {
      id: result.user.id,
      fullName: result.user.full_name,
      phone: result.user.phone,
      email: result.user.email,
      username: result.user.username,
      role: dto.role,
      tempPassword: result.tempPassword,
      tempPasswordExpiresAt,
      student: result.student,
      teacher: result.teacher,
      guardian: result.guardian,
    };
  }

  /**
   * Liên kết Phụ huynh - Học sinh (tối đa 4 phụ huynh, 3 cờ quyền) (FR-202)
   */
  async linkGuardian(
    studentId: string,
    guardianId: string,
    relation: 'father' | 'mother' | 'grandparent' | 'guardian' | 'other',
    flags: { canViewResults?: boolean; canMessage?: boolean; receivesFeeNotice?: boolean },
    actorId?: string,
  ) {
    const student = await this.prisma.students.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Không tìm thấy học sinh');
    }
    const guardian = await this.prisma.guardians.findUnique({ where: { id: guardianId } });
    if (!guardian) {
      throw new NotFoundException('Không tìm thấy phụ huynh');
    }

    const currentCount = await this.prisma.guardianships.count({
      where: { student_id: studentId },
    });
    if (currentCount >= 4) {
      throw new BadRequestException('Mỗi học sinh chỉ được liên kết tối đa 4 phụ huynh (FR-202)');
    }

    const guardianship = await this.prisma.guardianships.create({
      data: {
        student_id: studentId,
        guardian_id: guardianId,
        relation,
        can_view_results: flags.canViewResults !== false,
        can_message: flags.canMessage !== false,
        receives_fee_notice: flags.receivesFeeNotice !== false,
      },
    });

    await this.prisma.audit_logs.create({
      data: {
        actor_id: actorId,
        action: 'guardianship.link',
        entity: 'guardianships',
        entity_id: studentId,
        after_data: { relation, flags },
        reason: 'Liên kết phụ huynh với học sinh',
      },
    });

    return guardianship;
  }

  /**
   * Cập nhật 3 cờ quyền của phụ huynh (FR-202)
   */
  async updateGuardianship(
    studentId: string,
    guardianId: string,
    flags: UpdateGuardianshipRequest,
    actorId?: string,
  ) {
    const existing = await this.prisma.guardianships.findUnique({
      where: {
        student_id_guardian_id: { student_id: studentId, guardian_id: guardianId },
      },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy liên kết phụ huynh - học sinh');
    }

    const updated = await this.prisma.guardianships.update({
      where: {
        student_id_guardian_id: { student_id: studentId, guardian_id: guardianId },
      },
      data: {
        can_view_results: flags.canViewResults !== undefined ? flags.canViewResults : undefined,
        can_message: flags.canMessage !== undefined ? flags.canMessage : undefined,
        receives_fee_notice: flags.receivesFeeNotice !== undefined ? flags.receivesFeeNotice : undefined,
      },
    });

    await this.prisma.audit_logs.create({
      data: {
        actor_id: actorId,
        action: 'guardianship.update_flags',
        entity: 'guardianships',
        entity_id: studentId,
        before_data: {
          canViewResults: Boolean(existing.can_view_results),
          canMessage: Boolean(existing.can_message),
          receivesFeeNotice: Boolean(existing.receives_fee_notice),
        },
        after_data: flags,
        reason: 'Cập nhật phân quyền phụ huynh',
      },
    });

    return updated;
  }

  /**
   * Danh sách người dùng
   */
  async findAll(query: { role?: string; search?: string; limit?: number; offset?: number }) {
    const limit = Math.min(query.limit || 50, 100);
    const offset = query.offset || 0;

    const where: any = { deleted_at: null };
    if (query.role) {
      where.user_roles_user_roles_user_idTousers = {
        some: {
          roles: {
            code: query.role,
          },
        },
      };
    }
    if (query.search) {
      where.OR = [
        { full_name: { contains: query.search } },
        { phone: { contains: query.search } },
        { email: { contains: query.search } },
        { username: { contains: query.search } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.users.count({ where }),
      this.prisma.users.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { created_at: 'desc' },
        include: {
          user_roles_user_roles_user_idTousers: {
            include: { roles: true },
          },
          students: true,
          teachers: true,
          guardians: true,
        },
      }),
    ]);

    return {
      total,
      limit,
      offset,
      items: items.map((u) => ({
        id: u.id,
        fullName: u.full_name,
        phone: u.phone,
        email: u.email,
        username: u.username,
        status: u.status,
        roles: u.user_roles_user_roles_user_idTousers.map((ur) => ur.roles.code),
        createdAt: u.created_at,
        studentId: u.students?.id,
        isYoungAccount: Boolean(u.students?.is_young_account),
        teacherId: u.teachers?.id,
        guardianId: u.guardians?.id,
      })),
    };
  }

  /**
   * Khóa hoặc mở khóa tài khoản người dùng
   */
  async toggleLock(id: string, lock: boolean, reason: string, actorId?: string) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const newStatus = lock ? UserStatus.LOCKED : UserStatus.ACTIVE;
    await this.prisma.users.update({
      where: { id },
      data: {
        status: newStatus,
        locked_until: lock ? new Date(Date.now() + 365 * 24 * 3600 * 1000) : null,
      },
    });

    await this.prisma.audit_logs.create({
      data: {
        actor_id: actorId,
        action: lock ? 'user.lock' : 'user.unlock',
        entity: 'users',
        entity_id: id,
        reason,
      },
    });

    return { message: lock ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' };
  }
}
