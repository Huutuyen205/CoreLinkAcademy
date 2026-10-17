import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPE_KEY, ScopeOptions } from '../decorators/scope.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleCode, AuthUserResponse } from '@corelink/shared';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const scopeOptions = this.reflector.getAllAndOverride<ScopeOptions>(SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!scopeOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUserResponse = request.user;
    if (!user) {
      throw new ForbiddenException('Truy cập bị từ chối');
    }

    // Admin có toàn quyền truy cập mọi phạm vi
    if (user.roles.includes(RoleCode.ADMIN)) {
      return true;
    }

    const paramName = scopeOptions.paramName || 'id';
    const targetId = request.params[paramName] || request.body[paramName] || request.query[paramName];

    if (!targetId) {
      return true;
    }

    const { target, permissionField } = scopeOptions;

    // 1. Kiểm tra phạm vi Học sinh (student)
    if (target === 'student') {
      // Nếu là học sinh: chỉ truy cập dữ liệu của chính mình
      if (user.roles.includes(RoleCode.STUDENT)) {
        if (user.studentId !== targetId) {
          throw new ForbiddenException('Bạn không có quyền truy cập dữ liệu học sinh khác');
        }
        return true;
      }

      // Nếu là phụ huynh: chỉ truy cập học sinh nằm trong guardianships của mình
      if (user.roles.includes(RoleCode.GUARDIAN)) {
        if (!user.guardianId) {
          throw new ForbiddenException('Không tìm thấy hồ sơ phụ huynh');
        }

        const guardianship = await this.prisma.guardianships.findUnique({
          where: {
            student_id_guardian_id: {
              student_id: targetId,
              guardian_id: user.guardianId,
            },
          },
        });

        if (!guardianship) {
          throw new ForbiddenException('Học sinh không thuộc quyền giám hộ của bạn');
        }

        if (permissionField && !guardianship[permissionField]) {
          throw new ForbiddenException(`Bạn không có quyền ${permissionField} đối với học sinh này`);
        }

        return true;
      }

      // Nếu là giáo viên: phải dạy lớp mà học sinh đó đang theo học
      if (user.roles.includes(RoleCode.TEACHER)) {
        if (!user.teacherId) {
          throw new ForbiddenException('Không tìm thấy hồ sơ giáo viên');
        }

        const teacherClasses = await this.prisma.class_teachers.findMany({
          where: {
            teacher_id: user.teacherId,
            to_date: null,
          },
          select: { class_id: true },
        });

        const classIds = teacherClasses.map((tc) => tc.class_id);

        const isEnrolled = await this.prisma.enrollments.findFirst({
          where: {
            student_id: targetId,
            class_id: { in: classIds },
            status: 'active',
          },
        });

        if (!isEnrolled) {
          throw new ForbiddenException('Học sinh này không thuộc lớp bạn phụ trách');
        }

        return true;
      }
    }

    // 2. Kiểm tra phạm vi Lớp học (class)
    if (target === 'class') {
      if (user.roles.includes(RoleCode.TEACHER)) {
        if (!user.teacherId) {
          throw new ForbiddenException('Không tìm thấy hồ sơ giáo viên');
        }

        const isAssigned = await this.prisma.class_teachers.findFirst({
          where: {
            class_id: targetId,
            teacher_id: user.teacherId,
            to_date: null,
          },
        });

        if (!isAssigned) {
          throw new ForbiddenException('Bạn không được phân công phụ trách lớp học này');
        }
        return true;
      }

      if (user.roles.includes(RoleCode.STUDENT)) {
        if (!user.studentId) {
          throw new ForbiddenException('Không tìm thấy hồ sơ học sinh');
        }

        const enrollment = await this.prisma.enrollments.findFirst({
          where: {
            class_id: targetId,
            student_id: user.studentId,
            status: 'active',
          },
        });

        if (!enrollment) {
          throw new ForbiddenException('Bạn không ghi danh vào lớp học này');
        }
        return true;
      }

      if (user.roles.includes(RoleCode.GUARDIAN)) {
        if (!user.guardianId) {
          throw new ForbiddenException('Không tìm thấy hồ sơ phụ huynh');
        }

        const children = await this.prisma.guardianships.findMany({
          where: { guardian_id: user.guardianId },
          select: { student_id: true },
        });

        const childIds = children.map((c) => c.student_id);

        const childInClass = await this.prisma.enrollments.findFirst({
          where: {
            class_id: targetId,
            student_id: { in: childIds },
            status: 'active',
          },
        });

        if (!childInClass) {
          throw new ForbiddenException('Không có con của bạn học trong lớp này');
        }
        return true;
      }
    }

    // 3. Nhân viên: kiểm tra theo branch_id
    if (user.roles.includes(RoleCode.ACADEMIC) || user.roles.includes(RoleCode.CONSULTANT) || user.roles.includes(RoleCode.ACCOUNTANT)) {
      if (scopeOptions.target === 'branch' && targetId !== user.branchId) {
        throw new ForbiddenException('Dữ liệu không thuộc cơ sở bạn phụ trách');
      }
      return true;
    }

    return true;
  }
}
