import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  AttendanceService,
  QuickAttendanceRecordDto,
  VerifyTeacherCheckinDto,
} from './attendance.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Sinh mã QR động cho buổi học (FR-402, TC-052, TC-053)
   */
  @Post('sessions/:id/qr')
  @Roles('admin', 'academic', 'teacher')
  @HttpCode(HttpStatus.OK)
  async generateSessionQr(
    @Param('id') sessionId: string,
    @Body('kind') kind: 'offline' | 'online' = 'offline'
  ) {
    return this.attendanceService.generateSessionQr(sessionId, kind);
  }

  /**
   * Giáo viên mở buổi offline: QR + Chụp ảnh lớp + GPS định vị (FR-403, TC-054..TC-056)
   */
  @Post('sessions/:id/verify-teacher')
  @Roles('teacher', 'admin', 'academic')
  @HttpCode(HttpStatus.OK)
  async verifyTeacherCheckin(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Body() dto: VerifyTeacherCheckinDto
  ) {
    const teacherUserId = req.user.id || req.user.userId;
    return this.attendanceService.verifyTeacherCheckin(sessionId, teacherUserId, dto);
  }

  /**
   * Giáo viên yêu cầu điểm danh thủ công kèm lý do khi lỗi QR/GPS (TC-055, TC-056)
   */
  @Post('sessions/:id/manual-checkin')
  @Roles('teacher', 'admin', 'academic')
  @HttpCode(HttpStatus.CREATED)
  async requestManualTeacherCheckin(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Body('reason') reason: string
  ) {
    const teacherUserId = req.user.id || req.user.userId;
    return this.attendanceService.requestManualTeacherCheckin(
      sessionId,
      teacherUserId,
      reason
    );
  }

  /**
   * Giáo vụ phê duyệt điểm danh thủ công (TC-055)
   */
  @Post('checkins/:id/approve-manual')
  @Roles('admin', 'academic')
  @HttpCode(HttpStatus.OK)
  async approveManualTeacherCheckin(
    @Request() req: any,
    @Param('id') checkinId: string
  ) {
    const actorUserId = req.user.id || req.user.userId;
    return this.attendanceService.approveManualTeacherCheckin(actorUserId, checkinId);
  }

  /**
   * Điểm danh nhanh toàn lớp (FR-401, TC-051, TC-065)
   */
  @Post('sessions/:id/quick')
  @Roles('admin', 'academic', 'teacher')
  @HttpCode(HttpStatus.OK)
  async quickAttendance(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Body('records') records: QuickAttendanceRecordDto[]
  ) {
    const actorUserId = req.user.id || req.user.userId;
    return this.attendanceService.quickAttendance(actorUserId, sessionId, records);
  }

  /**
   * Học sinh quét mã QR điểm danh (FR-404, TC-058, TC-059)
   */
  @Post('sessions/:id/student-scan')
  @Roles('student', 'admin')
  @HttpCode(HttpStatus.OK)
  async studentScanQr(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Body('nonce') nonce: string
  ) {
    const studentUserId = req.user.id || req.user.userId;
    return this.attendanceService.studentScanQr(studentUserId, sessionId, nonce);
  }

  /**
   * Nộp đơn xin nghỉ học trước buổi (FR-406, TC-063)
   */
  @Post('absence-requests')
  @Roles('guardian', 'student', 'admin', 'academic')
  @HttpCode(HttpStatus.CREATED)
  async submitAbsenceRequest(
    @Request() req: any,
    @Body() dto: { sessionId: string; studentId: string; reason: string }
  ) {
    const userId = req.user.id || req.user.userId;
    return this.attendanceService.submitAbsenceRequest(userId, dto);
  }

  /**
   * Sửa điểm danh sau buổi học có lý do & ghi Audit Log (FR-408, TC-064)
   */
  @Post(':id/correct')
  @Roles('admin', 'academic', 'teacher')
  @HttpCode(HttpStatus.OK)
  async correctAttendancePostSession(
    @Request() req: any,
    @Param('id') attendanceId: string,
    @Body()
    dto: {
      status: 'present' | 'late' | 'excused' | 'absent';
      reason: string;
    }
  ) {
    return this.attendanceService.correctAttendancePostSession(
      req.user,
      attendanceId,
      dto.status,
      dto.reason
    );
  }

  /**
   * Tác vụ tự động dọn dẹp ảnh điểm danh quá 30 ngày (TC-057)
   */
  @Post('cleanup-photos')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async cleanupOldPhotosJob() {
    return this.attendanceService.cleanupOldPhotosJob();
  }

  /**
   * Lấy chi tiết điểm danh của buổi học (S28)
   */
  @Get('sessions/:id')
  @Roles('admin', 'academic', 'teacher')
  async getSessionAttendance(@Param('id') sessionId: string) {
    return this.attendanceService.getSessionAttendance(sessionId);
  }

  /**
   * Lấy lịch sử chuyên cần của học sinh (S19)
   */
  @Get('history')
  @Roles('student', 'guardian', 'admin', 'academic')
  async getStudentAttendanceHistory(
    @Request() req: any,
    @Query('studentId') studentId?: string
  ) {
    return this.attendanceService.getStudentAttendanceHistory(req.user, studentId);
  }
}
