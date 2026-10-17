import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export interface QuickAttendanceRecordDto {
  studentId: string;
  status: 'present' | 'late' | 'excused' | 'absent';
  note?: string;
}

export interface VerifyTeacherCheckinDto {
  nonce?: string;
  qrTokenId?: string;
  latitude?: number;
  longitude?: number;
  photoFileId?: string;
  photoBase64?: string;
  photoName?: string;
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // bán kính Trái Đất theo mét
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sinh mã QR động cho buổi học (FR-402, TC-052, TC-053)
   */
  async generateSessionQr(sessionId: string, kind: 'offline' | 'online' = 'offline') {
    const session = await this.prisma.class_sessions.findUnique({
      where: { id: sessionId },
      include: { classes: true },
    });
    if (!session) throw new NotFoundException('Không tìm thấy buổi học');

    const nonce = crypto.randomBytes(16).toString('hex');
    const now = new Date();
    // Offline hạn 10 phút, Online hạn 30 phút
    const validUntil = new Date(now.getTime() + (kind === 'offline' ? 10 : 30) * 60 * 1000);

    const token = await this.prisma.session_qr_tokens.upsert({
      where: { session_id_kind: { session_id: sessionId, kind } },
      update: {
        nonce,
        valid_from: now,
        valid_until: validUntil,
      },
      create: {
        session_id: sessionId,
        kind,
        nonce,
        valid_from: now,
        valid_until: validUntil,
      },
    });

    return {
      tokenId: token.id,
      sessionId: session.id,
      classCode: session.classes.code,
      sessionNo: session.session_no,
      kind,
      nonce: token.nonce,
      validFrom: token.valid_from,
      validUntil: token.valid_until,
      qrContent: JSON.stringify({
        sessionId: session.id,
        kind,
        nonce: token.nonce,
      }),
    };
  }

  /**
   * Giáo viên mở buổi offline & Xác thực buổi học bằng QR + Chụp ảnh + GPS (FR-403, TC-054..TC-056)
   */
  async verifyTeacherCheckin(
    sessionId: string,
    teacherUserId: string,
    dto: VerifyTeacherCheckinDto
  ) {
    const session = await this.prisma.class_sessions.findUnique({
      where: { id: sessionId },
      include: { branches: true, classes: true },
    });
    if (!session) throw new NotFoundException('Không tìm thấy buổi học');

    // Lấy thông tin teacher từ userId
    const teacher = await this.prisma.teachers.findUnique({
      where: { user_id: teacherUserId },
    });
    if (!teacher) throw new ForbiddenException('Chỉ giáo viên mới được thực hiện xác thực mở buổi');

    // 1. Kiểm tra QR (TC-052, TC-053)
    let qrTokenRecord = null;
    if (dto.nonce) {
      qrTokenRecord = await this.prisma.session_qr_tokens.findUnique({
        where: { nonce: dto.nonce },
      });
      if (!qrTokenRecord || qrTokenRecord.session_id !== sessionId) {
        throw new BadRequestException('QR không thuộc buổi học này hoặc không hợp lệ');
      }
      if (new Date() > qrTokenRecord.valid_until) {
        throw new BadRequestException('QR đã hết hạn');
      }
    } else if (dto.qrTokenId) {
      qrTokenRecord = await this.prisma.session_qr_tokens.findUnique({
        where: { id: dto.qrTokenId },
      });
      if (!qrTokenRecord || qrTokenRecord.session_id !== sessionId) {
        throw new BadRequestException('QR không thuộc buổi học này hoặc không hợp lệ');
      }
      if (new Date() > qrTokenRecord.valid_until) {
        throw new BadRequestException('QR đã hết hạn');
      }
    }

    // 2. Xử lý ảnh chụp lớp nếu có
    let photoFileId = dto.photoFileId || null;
    if (dto.photoBase64 && !photoFileId) {
      const buffer = Buffer.from(dto.photoBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      if (buffer.length > 1024 * 1024) {
        throw new BadRequestException('Ảnh chụp lớp vượt quá dung lượng tối đa 1 MB');
      }

      const fileRecord = await this.prisma.files.create({
        data: {
          branch_id: session.branch_id,
          storage_key: `attendance/${sessionId}/${Date.now()}_photo.jpg`,
          original_name: dto.photoName || 'class_photo.jpg',
          mime_type: 'image/jpeg',
          size_bytes: BigInt(buffer.length),
          purpose: 'attendance_photo',
          uploaded_by: teacherUserId,
        },
      });
      photoFileId = fileRecord.id;
    }

    // 3. Kiểm tra định vị GPS (TC-054, TC-055, TC-056)
    if (dto.latitude === undefined || dto.longitude === undefined) {
      // Từ chối quyền định vị (TC-056)
      const checkin = await this.prisma.teacher_checkins.create({
        data: {
          session_id: sessionId,
          teacher_id: teacher.id,
          qr_token_id: qrTokenRecord?.id || null,
          photo_file_id: photoFileId,
          result: 'rejected_no_location',
        },
      });

      return {
        checkinId: checkin.id,
        result: 'rejected_no_location',
        verified: false,
        message: 'Không thể định vị GPS. Vui lòng bật quyền vị trí hoặc điểm danh thủ công kèm lý do.',
      };
    }

    const branchLat = Number(session.branches.latitude || 21.028511);
    const branchLon = Number(session.branches.longitude || 105.854444);
    const maxRadius = session.branches.checkin_radius_m || 150;

    const distance = calculateDistanceMeters(
      dto.latitude,
      dto.longitude,
      branchLat,
      branchLon
    );

    if (distance > maxRadius) {
      // Ngoài bán kính (TC-055)
      const checkin = await this.prisma.teacher_checkins.create({
        data: {
          session_id: sessionId,
          teacher_id: teacher.id,
          qr_token_id: qrTokenRecord?.id || null,
          photo_file_id: photoFileId,
          latitude: dto.latitude,
          longitude: dto.longitude,
          distance_m: distance,
          result: 'rejected_distance',
        },
      });

      return {
        checkinId: checkin.id,
        result: 'rejected_distance',
        distanceM: distance,
        maxRadiusM: maxRadius,
        verified: false,
        message: `Vị trí cách cơ sở ${distance} m (vượt quá bán kính cho phép ${maxRadius} m). Vui lòng điểm danh thủ công kèm lý do.`,
      };
    }

    // Trong bán kính -> Chấp thuận xác thực (TC-054)
    const checkin = await this.prisma.teacher_checkins.create({
      data: {
        session_id: sessionId,
        teacher_id: teacher.id,
        qr_token_id: qrTokenRecord?.id || null,
        photo_file_id: photoFileId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        distance_m: distance,
        result: 'accepted',
      },
    });

    await this.prisma.class_sessions.update({
      where: { id: sessionId },
      data: {
        verified_at: new Date(),
        verify_method: 'qr_offline',
        status: 'in_progress',
      },
    });

    return {
      checkinId: checkin.id,
      result: 'accepted',
      distanceM: distance,
      verified: true,
      verifiedAt: new Date().toISOString(),
      message: 'Mở buổi học offline thành công! Buổi học đã được xác thực.',
    };
  }

  /**
   * Giáo viên gửi yêu cầu điểm danh thủ công khi không thể quét QR/GPS (TC-055, TC-056)
   */
  async requestManualTeacherCheckin(
    sessionId: string,
    teacherUserId: string,
    reason: string
  ) {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Bắt buộc phải nhập lý do điểm danh thủ công');
    }

    const teacher = await this.prisma.teachers.findUnique({
      where: { user_id: teacherUserId },
    });
    if (!teacher) throw new ForbiddenException('Chỉ giáo viên mới được gửi yêu cầu');

    const checkin = await this.prisma.teacher_checkins.create({
      data: {
        session_id: sessionId,
        teacher_id: teacher.id,
        result: 'manual_pending',
        manual_reason: reason,
      },
    });

    return {
      checkinId: checkin.id,
      result: 'manual_pending',
      message: 'Yêu cầu điểm danh thủ công đã được gửi tới Giáo vụ phê duyệt',
    };
  }

  /**
   * Giáo vụ phê duyệt điểm danh thủ công (TC-055)
   */
  async approveManualTeacherCheckin(actorUserId: string, checkinId: string) {
    const checkin = await this.prisma.teacher_checkins.findUnique({
      where: { id: checkinId },
    });
    if (!checkin) throw new NotFoundException('Không tìm thấy bản ghi check-in');

    const updated = await this.prisma.teacher_checkins.update({
      where: { id: checkinId },
      data: {
        result: 'manual_approved',
        reviewed_by: actorUserId,
      },
    });

    await this.prisma.class_sessions.update({
      where: { id: checkin.session_id },
      data: {
        verified_at: new Date(),
        verify_method: 'manual',
        status: 'in_progress',
      },
    });

    return {
      checkinId: updated.id,
      result: 'manual_approved',
      verified: true,
      message: 'Giáo vụ đã phê duyệt xác thực buổi học thủ công thành công',
    };
  }

  /**
   * Điểm danh nhanh toàn lớp (FR-401, TC-051)
   */
  async quickAttendance(
    actorUserId: string,
    sessionId: string,
    records: QuickAttendanceRecordDto[]
  ) {
    const session = await this.prisma.class_sessions.findUnique({
      where: { id: sessionId },
      include: {
        classes: { select: { id: true, name: true, code: true } },
        rooms: { select: { name: true } },
        branches: { select: { name: true } },
      },
    });
    if (!session) throw new NotFoundException('Không tìm thấy buổi học');

    const now = new Date();
    const consecutiveAbsenceWarnings: Array<{ studentId: string; message: string }> = [];

    for (const rec of records) {
      await this.prisma.attendance.upsert({
        where: {
          session_id_student_id: {
            session_id: sessionId,
            student_id: rec.studentId,
          },
        },
        update: {
          status: rec.status,
          method: 'teacher',
          note: rec.note || null,
          recorded_by: actorUserId,
          checkin_at: rec.status === 'present' ? now : null,
          guardian_notified_at: rec.status === 'present' ? now : null,
        },
        create: {
          session_id: sessionId,
          student_id: rec.studentId,
          status: rec.status,
          method: 'teacher',
          note: rec.note || null,
          recorded_by: actorUserId,
          checkin_at: rec.status === 'present' ? now : null,
          guardian_notified_at: rec.status === 'present' ? now : null,
        },
      });

      // Kiểm tra vắng 2 buổi liên tiếp (TC-065)
      if (rec.status === 'absent' || rec.status === 'excused') {
        const warn = await this.checkConsecutiveAbsences(rec.studentId, sessionId);
        if (warn) {
          consecutiveAbsenceWarnings.push({
            studentId: rec.studentId,
            message: warn,
          });
        }
      }
    }

    return {
      sessionId,
      totalRecorded: records.length,
      savedAt: now.toISOString(),
      consecutiveAbsenceWarnings,
      message: 'Lưu điểm danh nhanh thành công dưới 30 giây',
    };
  }

  /**
   * Học sinh tự quét QR check-in (FR-404, TC-058, TC-059)
   */
  async studentScanQr(studentUserId: string, sessionId: string, nonce: string) {
    const student = await this.prisma.students.findUnique({
      where: { user_id: studentUserId },
    });
    if (!student) throw new ForbiddenException('Chỉ học sinh mới được quét QR điểm danh học viên');

    const session = await this.prisma.class_sessions.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Không tìm thấy buổi học');

    // 1. Kiểm tra QR Token (TC-052, TC-053)
    const token = await this.prisma.session_qr_tokens.findUnique({
      where: { nonce },
    });
    if (!token || token.session_id !== sessionId) {
      throw new BadRequestException('QR không thuộc buổi này');
    }
    if (new Date() > token.valid_until) {
      throw new BadRequestException('QR đã hết hạn');
    }

    // 2. Kiểm tra thời gian quét online (TC-058, TC-059)
    const now = new Date();
    const sessionStartsAt = new Date(session.starts_at);
    const fifteenMinsAfter = new Date(sessionStartsAt.getTime() + 15 * 60 * 1000);

    let status: 'present' | 'late' = 'present';
    if (now > fifteenMinsAfter) {
      status = 'late'; // Đi muộn sau 15 phút (TC-059)
    }

    const att = await this.prisma.attendance.upsert({
      where: {
        session_id_student_id: {
          session_id: sessionId,
          student_id: student.id,
        },
      },
      update: {
        status,
        method: 'qr_student',
        checkin_at: now,
        guardian_notified_at: now,
      },
      create: {
        session_id: sessionId,
        student_id: student.id,
        status,
        method: 'qr_student',
        checkin_at: now,
        guardian_notified_at: now,
      },
    });

    return {
      attendanceId: att.id,
      status: att.status,
      method: att.method,
      checkinAt: att.checkin_at,
      message:
        status === 'present'
          ? 'Điểm danh có mặt thành công'
          : 'Điểm danh ghi nhận đi muộn (quét sau 15 phút)',
    };
  }

  /**
   * Phụ huynh / Học sinh nộp đơn xin nghỉ học trước buổi (FR-406, TC-063)
   */
  async submitAbsenceRequest(
    userId: string,
    dto: { sessionId: string; studentId: string; reason: string }
  ) {
    if (!dto.reason || dto.reason.trim() === '') {
      throw new BadRequestException('Bắt buộc phải nhập lý do xin nghỉ');
    }

    const session = await this.prisma.class_sessions.findUnique({
      where: { id: dto.sessionId },
    });
    if (!session) throw new NotFoundException('Không tìm thấy buổi học');

    // Bắt buộc xin nghỉ TRƯỚC giờ bắt đầu buổi học (TC-063)
    if (new Date() >= new Date(session.starts_at)) {
      throw new BadRequestException('Đơn xin nghỉ chỉ được gửi trước khi buổi học bắt đầu');
    }

    const req = await this.prisma.absence_requests.upsert({
      where: {
        session_id_student_id: {
          session_id: dto.sessionId,
          student_id: dto.studentId,
        },
      },
      update: {
        requested_by: userId,
        reason: dto.reason,
      },
      create: {
        session_id: dto.sessionId,
        student_id: dto.studentId,
        requested_by: userId,
        reason: dto.reason,
      },
    });

    // Tự động ghi nhận vắng có phép (excused)
    await this.prisma.attendance.upsert({
      where: {
        session_id_student_id: {
          session_id: dto.sessionId,
          student_id: dto.studentId,
        },
      },
      update: {
        status: 'excused',
        method: 'absence_request',
        note: dto.reason,
        guardian_notified_at: new Date(),
      },
      create: {
        session_id: dto.sessionId,
        student_id: dto.studentId,
        status: 'excused',
        method: 'absence_request',
        note: dto.reason,
        guardian_notified_at: new Date(),
      },
    });

    return {
      id: req.id,
      sessionId: req.session_id,
      studentId: req.student_id,
      status: 'excused',
      message: 'Gửi đơn xin nghỉ học thành công. Buổi học được tự động ghi nhận vắng có phép.',
    };
  }

  /**
   * Sửa điểm danh sau buổi học — Bắt buộc Giáo vụ / Admin + nhập lý do + ghi audit logs (FR-408, TC-064)
   */
  async correctAttendancePostSession(
    actorUser: any,
    attendanceId: string,
    newStatus: 'present' | 'late' | 'excused' | 'absent',
    reason: string
  ) {
    const isStaff = actorUser.roles.some((r: string) => ['admin', 'academic'].includes(r));
    if (!isStaff) {
      throw new ForbiddenException(
        'Giáo viên không được sửa điểm danh sau khi buổi học đã kết thúc. Chỉ Giáo vụ hoặc Admin mới có quyền sửa.'
      );
    }

    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Bắt buộc phải nhập lý do điều chỉnh điểm danh');
    }

    const att = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
    });
    if (!att) throw new NotFoundException('Không tìm thấy bản ghi điểm danh');

    const beforeData = {
      status: att.status,
      method: att.method,
      note: att.note,
    };

    const updated = await this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: newStatus,
        note: `[Đã sửa bởi ${actorUser.fullName || actorUser.email}]: ${reason}`,
      },
    });

    const afterData = {
      status: updated.status,
      method: updated.method,
      note: updated.note,
    };

    // Ghi nhận Audit Log (TC-064)
    await this.prisma.audit_logs.create({
      data: {
        actor_id: actorUser.id || actorUser.userId,
        action: 'correct_attendance',
        entity: 'attendance',
        entity_id: attendanceId,
        before_data: beforeData,
        after_data: afterData,
        reason,
      },
    });

    return {
      attendanceId: updated.id,
      oldStatus: beforeData.status,
      newStatus: updated.status,
      reason,
      message: 'Điều chỉnh điểm danh sau buổi học thành công và đã ghi nhận vào sổ kiểm toán audit logs',
    };
  }

  /**
   * Tác vụ dọn dẹp ảnh điểm danh quá 30 ngày (TC-057)
   */
  async cleanupOldPhotosJob() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldPhotos = await this.prisma.files.findMany({
      where: {
        purpose: 'attendance_photo',
        created_at: { lt: thirtyDaysAgo },
      },
      select: { id: true },
    });

    const count = oldPhotos.length;
    if (count > 0) {
      const ids = oldPhotos.map((p) => p.id);
      // Gỡ liên kết trong teacher_checkins trước khi xóa file
      await this.prisma.teacher_checkins.updateMany({
        where: { photo_file_id: { in: ids } },
        data: { photo_file_id: null },
      });

      await this.prisma.files.deleteMany({
        where: { id: { in: ids } },
      });
    }

    return {
      deletedCount: count,
      thresholdDate: thirtyDaysAgo.toISOString(),
      message: `Đã dọn dẹp thành công ${count} ảnh điểm danh cũ hơn 30 ngày khỏi kho lưu trữ`,
    };
  }

  /**
   * Kiểm tra học sinh có bị vắng 2 buổi liên tiếp trong cùng lớp học không (FR-409, TC-065)
   */
  async checkConsecutiveAbsences(studentId: string, currentSessionId: string): Promise<string | null> {
    const currentSession = await this.prisma.class_sessions.findUnique({
      where: { id: currentSessionId },
    });
    if (!currentSession) return null;

    // Tìm buổi học liền kề trước đó của cùng lớp
    const prevSession = await this.prisma.class_sessions.findFirst({
      where: {
        class_id: currentSession.class_id,
        session_no: { lt: currentSession.session_no },
        status: { not: 'cancelled' },
      },
      orderBy: { session_no: 'desc' },
    });

    if (!prevSession) return null;

    const prevAtt = await this.prisma.attendance.findUnique({
      where: {
        session_id_student_id: {
          session_id: prevSession.id,
          student_id: studentId,
        },
      },
    });

    if (prevAtt && (prevAtt.status === 'absent' || prevAtt.status === 'excused')) {
      const student = await this.prisma.students.findUnique({
        where: { id: studentId },
        include: { users: true },
      });

      return `Cảnh báo: Học sinh ${student?.users.full_name || studentId} đã vắng 2 buổi liên tiếp (Buổi ${prevSession.session_no} và Buổi ${currentSession.session_no}). Cần liên hệ phụ huynh ngay!`;
    }

    return null;
  }

  /**
   * Lấy danh sách điểm danh của một buổi học
   */
  async getSessionAttendance(sessionId: string) {
    const session = await this.prisma.class_sessions.findUnique({
      where: { id: sessionId },
      include: {
        classes: {
          include: {
            enrollments: {
              where: { status: 'active' },
              include: { students: { include: { users: true } } },
            },
          },
        },
        attendance: { include: { students: { include: { users: true } } } },
        teacher_checkins: { include: { teachers: { include: { users: true } } } },
      },
    });

    if (!session) throw new NotFoundException('Không tìm thấy buổi học');

    const attMap = new Map(session.attendance.map((a: any) => [a.student_id, a]));

    const students = session.classes.enrollments.map((enr: any) => {
      const s = enr.students;
      const att = attMap.get(s.id);
      return {
        studentId: s.id,
        code: s.code,
        fullName: s.users.full_name,
        phone: s.users.phone,
        schoolName: s.school_name,
        status: att?.status || 'present', // Mặc định có mặt (FR-401)
        method: att?.method || null,
        checkinAt: att?.checkin_at || null,
        note: att?.note || '',
        attendanceId: att?.id || null,
      };
    });

    return {
      session: {
        id: session.id,
        sessionNo: session.session_no,
        startsAt: session.starts_at,
        endsAt: session.ends_at,
        status: session.status,
        verifiedAt: session.verified_at,
        verifyMethod: session.verify_method,
      },
      class: {
        id: session.classes.id,
        code: session.classes.code,
        name: session.classes.name,
      },
      checkins: session.teacher_checkins,
      students,
    };
  }

  /**
   * Lấy lịch sử chuyên cần của học sinh (S19)
   */
  async getStudentAttendanceHistory(user: any, targetStudentId?: string) {
    let studentId = targetStudentId;

    if (user.roles.includes('student') && !user.roles.includes('admin')) {
      const s = await this.prisma.students.findUnique({ where: { user_id: user.id || user.userId } });
      if (!s) throw new ForbiddenException('Không tìm thấy hồ sơ học sinh');
      studentId = s.id;
    } else if (user.roles.includes('guardian') && !user.roles.includes('admin')) {
      const g = await this.prisma.guardians.findUnique({ where: { user_id: user.id || user.userId } });
      if (!g) throw new ForbiddenException('Không tìm thấy hồ sơ phụ huynh');

      if (!studentId) {
        const firstChild = await this.prisma.guardianships.findFirst({
          where: { guardian_id: g.id },
          select: { student_id: true },
        });
        studentId = firstChild?.student_id;
      }
    }

    if (!studentId) {
      throw new BadRequestException('Bắt buộc phải chỉ định mã học sinh');
    }

    const records = await this.prisma.attendance.findMany({
      where: { student_id: studentId },
      include: {
        class_sessions: {
          include: {
            classes: { select: { code: true, name: true } },
            rooms: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return records.map((r: any) => ({
      attendanceId: r.id,
      sessionId: r.session_id,
      classCode: r.class_sessions.classes.code,
      className: r.class_sessions.classes.name,
      roomName: r.class_sessions.rooms?.name || 'Online',
      sessionNo: r.class_sessions.session_no,
      startsAt: r.class_sessions.starts_at,
      status: r.status,
      method: r.method,
      checkinAt: r.checkin_at,
      note: r.note,
    }));
  }
}
