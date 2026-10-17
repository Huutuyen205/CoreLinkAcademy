import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ClassRecurrenceItem {
  weekday: number; // 1 (Thứ 2) .. 7 (Chủ nhật)
  start: string; // '18:00'
  end: string; // '19:30'
}

export interface CreateClassDto {
  programId: string;
  code: string;
  name: string;
  mode?: 'offline' | 'online' | 'hybrid';
  roomId?: string;
  meetingUrl?: string;
  capacity?: number;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  recurrence: ClassRecurrenceItem[];
  homeroomTeacherId: string;
}

export interface EnrollStudentDto {
  studentId: string;
  feePlanId?: string;
  conflictAckReason?: string;
}

@Injectable()
export class AcademicService {
  private readonly logger = new Logger(AcademicService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cây đào tạo Cấp học → Chương trình → Lớp học & Tỷ lệ lấp đầy (FR-301, TC-039)
   */
  async getTrainingTree(branchId: string) {
    const levels = await this.prisma.levels.findMany({
      orderBy: { sort_order: 'asc' },
    });

    const programs = await this.prisma.programs.findMany({
      where: { branch_id: branchId, deleted_at: null },
      include: {
        levels: true,
        fee_plans: true,
        classes: {
          where: { deleted_at: null },
          include: {
            rooms: true,
            teachers: { include: { users: { select: { full_name: true, phone: true } } } },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    // Lấy thông tin thống kê sĩ số và lấp đầy từ enrollments
    const classIds: string[] = programs.flatMap((p: any) => p.classes.map((c: any) => c.id));
    const activeEnrollments = await this.prisma.enrollments.findMany({
      where: {
        class_id: { in: classIds },
        status: 'active',
      },
      select: { class_id: true },
    });

    const activeCountMap = new Map<string, number>();
    for (const enr of activeEnrollments) {
      activeCountMap.set(enr.class_id, (activeCountMap.get(enr.class_id) || 0) + 1);
    }

    // Ghép cây phân cấp
    const tree = levels.map((lvl: any) => {
      const levelPrograms = programs
        .filter((p: any) => p.level_id === lvl.id)
        .map((prog: any) => {
          const classesWithFill = prog.classes.map((cls: any) => {
            const activeStudents = Number(activeCountMap.get(cls.id) || 0);
            const capacity = Number(cls.capacity || 12);
            const fillRate = capacity > 0 ? Math.round((activeStudents / capacity) * 100) / 100 : 0;
            const lowFillWarning = fillRate < 0.5;

            return {
              id: cls.id,
              code: cls.code,
              name: cls.name,
              mode: cls.mode,
              capacity,
              activeStudents,
              fillRate,
              lowFillWarning, // Cảnh báo dưới 50%
              roomName: cls.rooms?.name || null,
              teacherName: cls.teachers?.users?.full_name || null,
              startDate: cls.start_date,
              endDate: cls.end_date,
              status: cls.status,
            };
          });

          return {
            id: prog.id,
            code: prog.code,
            name: prog.name,
            framework: prog.framework,
            targetLevel: prog.target_level,
            totalSessions: prog.total_sessions,
            classes: classesWithFill,
          };
        });

      return {
        id: lvl.id,
        code: lvl.code,
        name: lvl.name,
        sortOrder: lvl.sort_order,
        programs: levelPrograms,
      };
    });

    return tree;
  }

  /**
   * Danh sách lớp học kèm tỷ lệ lấp đầy
   */
  async getClasses(branchId: string, filters?: { programId?: string; status?: string }) {
    const where: any = { branch_id: branchId, deleted_at: null };
    if (filters?.programId) where.program_id = filters.programId;
    if (filters?.status) where.status = filters.status;

    const classes = await this.prisma.classes.findMany({
      where,
      include: {
        programs: { select: { name: true, code: true, framework: true } },
        rooms: { select: { name: true, capacity: true } },
        teachers: { select: { users: { select: { full_name: true, phone: true } } } },
      },
      orderBy: { created_at: 'desc' },
    });

    const classIds = classes.map((c: any) => c.id);
    const activeCounts = await this.prisma.enrollments.groupBy({
      by: ['class_id'],
      where: { class_id: { in: classIds }, status: 'active' },
      _count: { id: true },
    });

    const countMap = new Map(activeCounts.map((c: any) => [c.class_id, c._count.id]));

    return classes.map((cls: any) => {
      const activeStudents = Number(countMap.get(cls.id) || 0);
      const capacity = Number(cls.capacity || 12);
      const fillRate = capacity > 0 ? Math.round((activeStudents / capacity) * 100) / 100 : 0;
      return {
        id: cls.id,
        code: cls.code,
        name: cls.name,
        mode: cls.mode,
        capacity,
        activeStudents,
        fillRate,
        lowFillWarning: fillRate < 0.5,
        programName: cls.programs.name,
        roomName: cls.rooms?.name || null,
        homeroomTeacher: cls.teachers?.users?.full_name || null,
        startDate: cls.start_date,
        endDate: cls.end_date,
        status: cls.status,
      };
    });
  }

  /**
   * Chi tiết lớp học
   */
  async getClassDetail(classId: string) {
    const cls = await this.prisma.classes.findUnique({
      where: { id: classId },
      include: {
        programs: { include: { levels: true, fee_plans: true } },
        rooms: true,
        teachers: { include: { users: true } },
        class_teachers: { include: { teachers: { include: { users: true } } } },
        class_sessions: {
          orderBy: { session_no: 'asc' },
          include: {
            rooms: true,
            teachers_class_sessions_teacher_idToteachers: { include: { users: true } },
          },
        },
        enrollments: {
          where: { status: 'active' },
          include: { students: { include: { users: true } } },
        },
      },
    });

    if (!cls) throw new NotFoundException('Không tìm thấy lớp học');
    return cls;
  }

  /**
   * Tạo lớp học, tự sinh class_sessions và kiểm tra xung đột trùng phòng/giáo viên (FR-302, TC-040, TC-041, TC-042)
   */
  async createClass(branchId: string, actorId: string, dto: CreateClassDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
    }

    if (!dto.recurrence || dto.recurrence.length === 0) {
      throw new BadRequestException('Bắt buộc phải cấu hình lịch lặp tuần (recurrence)');
    }

    // 1. Lấy danh sách ngày nghỉ lễ để bỏ qua
    const holidays = await this.prisma.holidays.findMany({
      where: {
        branch_id: branchId,
        holiday_on: { gte: startDate, lte: endDate },
      },
    });
    const holidayDateStrings = new Set(
      holidays.map((h: any) => h.holiday_on.toISOString().slice(0, 10))
    );

    // 2. Tính toán danh sách các buổi học dự kiến
    const plannedSessions: Array<{ sessionNo: number; startsAt: Date; endsAt: Date }> = [];
    const currentDate = new Date(startDate);
    let sessionCounter = 1;

    while (currentDate <= endDate) {
      const jsDay = currentDate.getDay(); // 0 (CN), 1 (T2), .. 6 (T7)
      const standardWeekday = jsDay === 0 ? 7 : jsDay; // Quy đổi 1..7
      const dateStr = currentDate.toISOString().slice(0, 10);

      // Bỏ qua ngày nghỉ lễ (TC-040)
      if (!holidayDateStrings.has(dateStr)) {
        const matchingSchedules = dto.recurrence.filter((r) => r.weekday === standardWeekday);
        for (const sched of matchingSchedules) {
          const [startHour, startMin] = sched.start.split(':').map(Number);
          const [endHour, endMin] = sched.end.split(':').map(Number);

          const startsAt = new Date(currentDate);
          startsAt.setHours(startHour, startMin, 0, 0);

          const endsAt = new Date(currentDate);
          endsAt.setHours(endHour, endMin, 0, 0);

          plannedSessions.push({
            sessionNo: sessionCounter++,
            startsAt,
            endsAt,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (plannedSessions.length === 0) {
      throw new BadRequestException('Không có buổi học nào được sinh ra từ cấu hình lịch lặp');
    }

    // 3. KIỂM TRA TRÙNG PHÒNG HỌC (TC-041)
    if (dto.roomId) {
      for (const ps of plannedSessions) {
        const roomConflict = await this.prisma.class_sessions.findFirst({
          where: {
            room_id: dto.roomId,
            status: { not: 'cancelled' },
            starts_at: { lt: ps.endsAt },
            ends_at: { gt: ps.startsAt },
          },
          include: { classes: { select: { code: true, name: true } } },
        });

        if (roomConflict) {
          throw new ConflictException({
            message: `Trùng phòng học tại buổi ${ps.sessionNo} (${ps.startsAt.toISOString()} - ${ps.endsAt.toISOString()}) với lớp ${roomConflict.classes.code}`,
            conflictType: 'room',
            conflictingClass: roomConflict.classes,
            sessionTime: { startsAt: ps.startsAt, endsAt: ps.endsAt },
          });
        }
      }
    }

    // 4. KIỂM TRA TRÙNG GIÁO VIÊN (TC-042)
    for (const ps of plannedSessions) {
      const teacherConflict = await this.prisma.class_sessions.findFirst({
        where: {
          teacher_id: dto.homeroomTeacherId,
          status: { not: 'cancelled' },
          starts_at: { lt: ps.endsAt },
          ends_at: { gt: ps.startsAt },
        },
        include: { classes: { select: { code: true, name: true } } },
      });

      if (teacherConflict) {
        throw new ConflictException({
          message: `Trùng lịch giáo viên tại buổi ${ps.sessionNo} (${ps.startsAt.toISOString()} - ${ps.endsAt.toISOString()}) với lớp ${teacherConflict.classes.code}`,
          conflictType: 'teacher',
          conflictingClass: teacherConflict.classes,
          sessionTime: { startsAt: ps.startsAt, endsAt: ps.endsAt },
        });
      }
    }

    // 5. Tạo lớp học trong CSDL
    const createdClass = await this.prisma.classes.create({
      data: {
        branch_id: branchId,
        program_id: dto.programId,
        code: dto.code,
        name: dto.name,
        mode: dto.mode || 'offline',
        room_id: dto.roomId || null,
        meeting_url: dto.meetingUrl || null,
        capacity: dto.capacity || 12,
        start_date: startDate,
        end_date: endDate,
        recurrence: dto.recurrence as any,
        homeroom_teacher_id: dto.homeroomTeacherId,
        status: 'planned',
        created_by: actorId,
      },
    });

    // Gán giáo viên chính
    await this.prisma.$executeRaw`INSERT IGNORE INTO class_teachers (class_id, teacher_id, role, from_date) VALUES (${createdClass.id}, ${dto.homeroomTeacherId}, 'main', ${startDate})`;

    // Sinh các bản ghi class_sessions
    await this.prisma.class_sessions.createMany({
      data: plannedSessions.map((s) => ({
        branch_id: branchId,
        class_id: createdClass.id,
        session_no: s.sessionNo,
        starts_at: s.startsAt,
        ends_at: s.endsAt,
        room_id: dto.roomId || null,
        meeting_url: dto.meetingUrl || null,
        teacher_id: dto.homeroomTeacherId,
        status: 'scheduled',
      })),
    });

    this.logger.log(`Tạo lớp ${createdClass.code} thành công với ${plannedSessions.length} buổi học.`);

    return {
      id: createdClass.id,
      code: createdClass.code,
      name: createdClass.name,
      totalSessions: plannedSessions.length,
      firstSession: plannedSessions[0]?.startsAt,
      lastSession: plannedSessions[plannedSessions.length - 1]?.startsAt,
    };
  }

  /**
   * Thời khóa biểu tuần đa chiều (FR-303, TC-043)
   */
  async getSchedule(
    branchId: string,
    user: any,
    query: {
      teacherId?: string;
      roomId?: string;
      classId?: string;
      studentId?: string;
      startDate: string;
      endDate: string;
    }
  ) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const where: any = {
      branch_id: branchId,
      starts_at: { gte: startDate },
      ends_at: { lte: endDate },
      status: { not: 'cancelled' },
    };

    // Áp dụng phân quyền RBAC 2 tầng (Scope Guard)
    const isStaff = user.roles.some((r: string) => ['admin', 'academic', 'consultant'].includes(r));

    if (user.roles.includes('student') && !isStaff) {
      // Học sinh chỉ thấy lịch của mình
      const student = await this.prisma.students.findUnique({ where: { user_id: user.id || user.userId } });
      if (!student) throw new ForbiddenException('Không tìm thấy hồ sơ học sinh');

      const enrolledClassIds = await this.prisma.enrollments
        .findMany({
          where: { student_id: student.id, status: 'active' },
          select: { class_id: true },
        })
        .then((res: any) => res.map((r: any) => r.class_id));

      where.class_id = { in: enrolledClassIds };
    } else if (user.roles.includes('guardian') && !isStaff) {
      // Phụ huynh chỉ thấy lịch của các con
      const guardian = await this.prisma.guardians.findUnique({ where: { user_id: user.id || user.userId } });
      if (!guardian) throw new ForbiddenException('Không tìm thấy hồ sơ phụ huynh');

      const childrenIds = await this.prisma.guardianships
        .findMany({
          where: { guardian_id: guardian.id },
          select: { student_id: true },
        })
        .then((res: any) => res.map((r: any) => r.student_id));

      const enrolledClassIds = await this.prisma.enrollments
        .findMany({
          where: { student_id: { in: childrenIds }, status: 'active' },
          select: { class_id: true },
        })
        .then((res: any) => res.map((r: any) => r.class_id));

      where.class_id = { in: enrolledClassIds };
    } else if (user.roles.includes('teacher') && !isStaff) {
      // Giáo viên chỉ thấy lịch dạy của mình
      const teacher = await this.prisma.teachers.findUnique({ where: { user_id: user.id || user.userId } });
      if (!teacher) throw new ForbiddenException('Không tìm thấy hồ sơ giáo viên');
      where.teacher_id = teacher.id;
    } else {
      // Staff: Lọc tùy chọn theo tham số query
      if (query.teacherId) where.teacher_id = query.teacherId;
      if (query.roomId) where.room_id = query.roomId;
      if (query.classId) where.class_id = query.classId;
      if (query.studentId) {
        const studentEnrollments = await this.prisma.enrollments
          .findMany({
            where: { student_id: query.studentId, status: 'active' },
            select: { class_id: true },
          })
          .then((res: any) => res.map((r: any) => r.class_id));
        where.class_id = { in: studentEnrollments };
      }
    }

    const sessions = await this.prisma.class_sessions.findMany({
      where,
      include: {
        classes: { select: { id: true, code: true, name: true, mode: true, meeting_url: true } },
        rooms: { select: { id: true, name: true } },
        teachers_class_sessions_teacher_idToteachers: {
          select: { id: true, users: { select: { full_name: true, phone: true } } },
        },
      },
      orderBy: { starts_at: 'asc' },
    });

    return sessions.map((s: any) => ({
      id: s.id,
      classId: s.class_id,
      classCode: s.classes.code,
      className: s.classes.name,
      mode: s.classes.mode,
      meetingUrl: s.meeting_url || s.classes.meeting_url, // FR-309
      sessionNo: s.session_no,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      roomId: s.room_id,
      roomName: s.rooms?.name || null,
      teacherId: s.teacher_id,
      teacherName: s.teachers_class_sessions_teacher_idToteachers?.users?.full_name || null,
      status: s.status,
    }));
  }

  /**
   * Gợi ý giáo viên dạy thay rảnh lịch và đúng chuyên môn (FR-304, TC-044)
   */
  async getSubstituteSuggestions(sessionId: string) {
    const session = await this.prisma.class_sessions.findUnique({
      where: { id: sessionId },
      include: { classes: { include: { programs: true } } },
    });
    if (!session) throw new NotFoundException('Không tìm thấy buổi học');

    // Tìm tất cả giáo viên thuộc cơ sở, trừ người dạy hiện tại
    const candidateTeachers = await this.prisma.teachers.findMany({
      where: {
        branch_id: session.branch_id,
        id: { not: session.teacher_id },
      },
      include: { users: { select: { full_name: true, phone: true } } },
    });

    // Lọc các giáo viên không bị trùng lịch dạy vào khung giờ này
    const availableTeachers = [];
    for (const t of candidateTeachers) {
      const conflict = await this.prisma.class_sessions.findFirst({
        where: {
          teacher_id: t.id,
          status: { not: 'cancelled' },
          starts_at: { lt: session.ends_at },
          ends_at: { gt: session.starts_at },
        },
      });

      if (!conflict) {
        availableTeachers.push({
          teacherId: t.id,
          fullName: t.users.full_name,
          phone: t.users.phone,
          isNative: t.is_public,
        });
      }
    }

    return {
      sessionId: session.id,
      sessionTime: { startsAt: session.starts_at, endsAt: session.ends_at },
      program: session.classes.programs.name,
      suggestedTeachers: availableTeachers,
    };
  }

  /**
   * Đề xuất đổi lịch hoặc dạy thay (FR-303, FR-304, TC-045)
   */
  async requestReschedule(
    userId: string,
    dto: {
      sessionId: string;
      type: 'reschedule' | 'substitute' | 'cancel';
      newStartsAt?: string;
      newEndsAt?: string;
      substituteTeacherId?: string;
      reason: string;
    }
  ) {
    const session = await this.prisma.class_sessions.findUnique({
      where: { id: dto.sessionId },
    });
    if (!session) throw new NotFoundException('Không tìm thấy buổi học');

    const req = await this.prisma.reschedule_requests.create({
      data: {
        session_id: dto.sessionId,
        requested_by: userId,
        type: dto.type,
        new_starts_at: dto.newStartsAt ? new Date(dto.newStartsAt) : null,
        new_ends_at: dto.newEndsAt ? new Date(dto.newEndsAt) : null,
        substitute_teacher_id: dto.substituteTeacherId || null,
        reason: dto.reason,
        status: 'pending',
      },
    });

    return req;
  }

  /**
   * Giáo vụ phê duyệt đề xuất đổi lịch / dạy thay (TC-045)
   */
  async approveReschedule(actorId: string, requestId: string) {
    const req = await this.prisma.reschedule_requests.findUnique({
      where: { id: requestId },
      include: { class_sessions: true },
    });
    if (!req) throw new NotFoundException('Không tìm thấy yêu cầu đổi lịch');
    if (req.status !== 'pending') throw new BadRequestException('Yêu cầu đã được xử lý trước đó');

    // Cập nhật buổi học tương ứng
    await this.prisma.$transaction(async (tx: any) => {
      if (req.type === 'reschedule' && req.new_starts_at && req.new_ends_at) {
        await tx.class_sessions.update({
          where: { id: req.session_id },
          data: {
            starts_at: req.new_starts_at,
            ends_at: req.new_ends_at,
          },
        });
      } else if (req.type === 'substitute' && req.substitute_teacher_id) {
        await tx.class_sessions.update({
          where: { id: req.session_id },
          data: {
            teacher_id: req.substitute_teacher_id,
            substitute_for_teacher_id: req.class_sessions.teacher_id,
          },
        });
      } else if (req.type === 'cancel') {
        await tx.class_sessions.update({
          where: { id: req.session_id },
          data: { status: 'cancelled' },
        });
      }

      await tx.reschedule_requests.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          decided_by: actorId,
          decided_at: new Date(),
        },
      });
    });

    return { message: 'Phê duyệt đổi lịch thành công', requestId };
  }

  /**
   * Ghi danh học sinh vào lớp (FR-305, FR-308, TC-046, TC-047, TC-048, TC-050)
   */
  async enrollStudent(branchId: string, actorId: string, classId: string, dto: EnrollStudentDto) {
    const cls = await this.prisma.classes.findUnique({
      where: { id: classId },
      include: {
        programs: true,
        teachers: { select: { other_workplace: true } },
      },
    });
    if (!cls) throw new NotFoundException('Không tìm thấy lớp học');

    const student = await this.prisma.students.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('Không tìm thấy học sinh');

    // 1. CHẶN LỚP ĐẦY (TC-047)
    const activeStudents = await this.prisma.enrollments.count({
      where: { class_id: classId, status: 'active' },
    });
    if (activeStudents >= cls.capacity) {
      throw new BadRequestException('Lớp học đã đầy sĩ số tối đa, không thể ghi danh thêm (FR-305)');
    }

    // 2. KIỂM TRA TRÙNG LỊCH HỌC SINH (TC-048)
    const targetSessions = await this.prisma.class_sessions.findMany({
      where: { class_id: classId, status: { not: 'cancelled' } },
    });

    const enrolledClassIds = await this.prisma.enrollments
      .findMany({
        where: { student_id: dto.studentId, status: 'active' },
        select: { class_id: true },
      })
      .then((res: any) => res.map((r: any) => r.class_id));

    if (enrolledClassIds.length > 0) {
      for (const ts of targetSessions) {
        const studentConflict = await this.prisma.class_sessions.findFirst({
          where: {
            class_id: { in: enrolledClassIds },
            status: { not: 'cancelled' },
            starts_at: { lt: ts.ends_at },
            ends_at: { gt: ts.starts_at },
          },
          include: { classes: { select: { code: true, name: true } } },
        });

        if (studentConflict) {
          throw new ConflictException({
            message: `Học sinh đã bị trùng lịch với lớp ${studentConflict.classes.code} vào ngày ${ts.starts_at.toISOString()}`,
            conflictType: 'student_schedule',
            conflictingClass: studentConflict.classes,
          });
        }
      }
    }

    // 3. CẢNH BÁO FR-308: QUY ĐỊNH DẠY THÊM (TC-050)
    let conflictWarning = null;
    const isSchoolCurriculum = cls.programs.is_school_curriculum;
    const teacherSchool = cls.teachers?.other_workplace?.trim().toLowerCase();
    const studentSchool = student.school_name?.trim().toLowerCase();

    if (isSchoolCurriculum && teacherSchool && studentSchool && teacherSchool === studentSchool) {
      if (!dto.conflictAckReason) {
        throw new BadRequestException(
          'Cảnh báo FR-308: Giáo viên đang dạy ở trường cùng trường với học sinh trong lớp thuộc chương trình phổ thông. Bắt buộc nhập lý do giải trình để tiếp tục ghi danh.'
        );
      }
      conflictWarning = 'Cảnh báo FR-308 đã được ghi nhận cùng lý do giải trình.';
    }

    // 4. Ghi danh thành công
    const enrollment = await this.prisma.enrollments.create({
      data: {
        branch_id: branchId,
        class_id: classId,
        student_id: dto.studentId,
        status: 'active',
        enrolled_on: new Date(),
        fee_plan_id: dto.feePlanId || cls.programs.default_fee_plan_id,
        conflict_ack_reason: dto.conflictAckReason || null,
        created_by: actorId,
      },
    });

    return {
      message: 'Ghi danh học sinh vào lớp thành công',
      enrollmentId: enrollment.id,
      conflictWarning,
    };
  }

  /**
   * Chuyển lớp giữ nguyên lịch sử điểm & điểm danh (FR-305, TC-049)
   */
  async transferStudent(
    branchId: string,
    actorId: string,
    enrollmentId: string,
    targetClassId: string,
    reason?: string
  ) {
    const currentEnr = await this.prisma.enrollments.findUnique({
      where: { id: enrollmentId },
    });
    if (!currentEnr) throw new NotFoundException('Không tìm thấy bản ghi ghi danh hiện tại');
    if (currentEnr.status !== 'active') throw new BadRequestException('Học sinh không còn hoạt động trong lớp cũ');

    const targetClass = await this.prisma.classes.findUnique({
      where: { id: targetClassId },
    });
    if (!targetClass) throw new NotFoundException('Không tìm thấy lớp học chuyển tới');

    // Chặn nếu lớp đích đầy
    const activeInTarget = await this.prisma.enrollments.count({
      where: { class_id: targetClassId, status: 'active' },
    });
    if (activeInTarget >= targetClass.capacity) {
      throw new BadRequestException('Lớp học chuyển tới đã đầy sĩ số tối đa');
    }

    // Thực hiện chuyển lớp trong 1 transaction
    const result = await this.prisma.$transaction(async (tx: any) => {
      // 1. Tạo enrollment mới ở lớp đích
      const newEnr = await tx.enrollments.create({
        data: {
          branch_id: branchId,
          class_id: targetClassId,
          student_id: currentEnr.student_id,
          status: 'active',
          enrolled_on: new Date(),
          fee_plan_id: currentEnr.fee_plan_id,
          conflict_ack_reason: reason || 'Chuyển lớp theo yêu cầu',
          created_by: actorId,
        },
      });

      // 2. Đóng enrollment cũ và liên kết
      await tx.enrollments.update({
        where: { id: enrollmentId },
        data: {
          status: 'transferred',
          ended_on: new Date(),
          transferred_to_enrollment_id: newEnr.id,
        },
      });

      return newEnr;
    });

    return {
      message: 'Chuyển lớp cho học sinh thành công, toàn bộ lịch sử điểm số và điểm danh được giữ nguyên',
      oldEnrollmentId: enrollmentId,
      newEnrollmentId: result.id,
      targetClassId,
    };
  }

  /**
   * Nhóm học tập trong lớp do Giáo viên tạo, chờ Giáo vụ/Admin duyệt (FR-306)
   */
  async createStudyGroup(
    actorId: string,
    classId: string,
    name: string,
    purpose: string,
    studentIds: string[]
  ) {
    const group = await this.prisma.study_groups.create({
      data: {
        class_id: classId,
        name,
        purpose,
        created_by: actorId,
        status: 'pending',
      },
    });

    if (studentIds.length > 0) {
      await this.prisma.study_group_members.createMany({
        data: studentIds.map((sId: string) => ({
          group_id: group.id,
          student_id: sId,
        })),
      });
    }

    return {
      id: group.id,
      name: group.name,
      status: group.status,
      message: 'Nhóm học tập đã được tạo và đang chờ Giáo vụ phê duyệt',
    };
  }

  /**
   * Phê duyệt nhóm học tập
   */
  async approveStudyGroup(actorId: string, groupId: string) {
    const group = await this.prisma.study_groups.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm học tập');

    const updated = await this.prisma.study_groups.update({
      where: { id: groupId },
      data: {
        status: 'approved',
        approved_by: actorId,
        approved_at: new Date(),
      },
    });

    return { message: 'Phê duyệt nhóm học tập thành công', groupId: updated.id };
  }
}
