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
import { AcademicService, CreateClassDto, EnrollStudentDto } from './academic.service';

@Controller('academic')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  /**
   * Cây đào tạo Cấp học → Chương trình → Lớp học & Tỷ lệ lấp đầy (FR-301, TC-039)
   */
  @Get('tree')
  @Roles('admin', 'academic', 'consultant')
  async getTrainingTree(@Request() req: any) {
    const branchId = req.user.branchId;
    return this.academicService.getTrainingTree(branchId);
  }

  /**
   * Danh sách lớp học kèm tỷ lệ lấp đầy
   */
  @Get('classes')
  @Roles('admin', 'academic', 'consultant', 'teacher')
  async getClasses(
    @Request() req: any,
    @Query('programId') programId?: string,
    @Query('status') status?: string
  ) {
    const branchId = req.user.branchId;
    return this.academicService.getClasses(branchId, { programId, status });
  }

  /**
   * Chi tiết lớp học
   */
  @Get('classes/:id')
  @Roles('admin', 'academic', 'consultant', 'teacher')
  async getClassDetail(@Param('id') id: string) {
    return this.academicService.getClassDetail(id);
  }

  /**
   * Tạo lớp học, tự sinh lịch và kiểm tra xung đột trùng phòng/giáo viên (FR-302, TC-040..TC-042)
   */
  @Post('classes')
  @Roles('admin', 'academic')
  @HttpCode(HttpStatus.CREATED)
  async createClass(@Request() req: any, @Body() dto: CreateClassDto) {
    const branchId = req.user.branchId;
    const actorId = req.user.id || req.user.userId;
    return this.academicService.createClass(branchId, actorId, dto);
  }

  /**
   * Thời khóa biểu tuần đa chiều (FR-303, TC-043)
   */
  @Get('schedule')
  async getSchedule(
    @Request() req: any,
    @Query('teacherId') teacherId?: string,
    @Query('roomId') roomId?: string,
    @Query('classId') classId?: string,
    @Query('studentId') studentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const branchId = req.user.branchId;
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1).toISOString();
    const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7).toISOString();

    return this.academicService.getSchedule(branchId, req.user, {
      teacherId,
      roomId,
      classId,
      studentId,
      startDate: startDate || defaultStart,
      endDate: endDate || defaultEnd,
    });
  }

  /**
   * Gợi ý giáo viên dạy thay rảnh lịch và đúng chuyên môn (FR-304, TC-044)
   */
  @Get('sessions/:id/substitute-suggestions')
  @Roles('admin', 'academic', 'teacher')
  async getSubstituteSuggestions(@Param('id') id: string) {
    return this.academicService.getSubstituteSuggestions(id);
  }

  /**
   * Đề xuất đổi lịch hoặc dạy thay (FR-303, FR-304, TC-045)
   */
  @Post('reschedule-requests')
  @Roles('admin', 'academic', 'teacher')
  @HttpCode(HttpStatus.CREATED)
  async requestReschedule(
    @Request() req: any,
    @Body()
    dto: {
      sessionId: string;
      type: 'reschedule' | 'substitute' | 'cancel';
      newStartsAt?: string;
      newEndsAt?: string;
      substituteTeacherId?: string;
      reason: string;
    }
  ) {
    const actorId = req.user.id || req.user.userId;
    return this.academicService.requestReschedule(actorId, dto);
  }

  /**
   * Giáo vụ phê duyệt đổi lịch (TC-045)
   */
  @Post('reschedule-requests/:id/approve')
  @Roles('admin', 'academic')
  @HttpCode(HttpStatus.OK)
  async approveReschedule(@Request() req: any, @Param('id') id: string) {
    const actorId = req.user.id || req.user.userId;
    return this.academicService.approveReschedule(actorId, id);
  }

  /**
   * Ghi danh học sinh vào lớp (FR-305, FR-308, TC-046, TC-047, TC-048, TC-050)
   */
  @Post('classes/:id/enroll')
  @Roles('admin', 'academic', 'consultant')
  @HttpCode(HttpStatus.CREATED)
  async enrollStudent(
    @Request() req: any,
    @Param('id') classId: string,
    @Body() dto: EnrollStudentDto
  ) {
    const branchId = req.user.branchId;
    const actorId = req.user.id || req.user.userId;
    return this.academicService.enrollStudent(branchId, actorId, classId, dto);
  }

  /**
   * Chuyển lớp giữ nguyên lịch sử điểm & điểm danh (FR-305, TC-049)
   */
  @Post('enrollments/:id/transfer')
  @Roles('admin', 'academic')
  @HttpCode(HttpStatus.OK)
  async transferStudent(
    @Request() req: any,
    @Param('id') enrollmentId: string,
    @Body() dto: { targetClassId: string; reason?: string }
  ) {
    const branchId = req.user.branchId;
    const actorId = req.user.id || req.user.userId;
    return this.academicService.transferStudent(
      branchId,
      actorId,
      enrollmentId,
      dto.targetClassId,
      dto.reason
    );
  }

  /**
   * Nhóm học tập trong lớp (FR-306)
   */
  @Post('study-groups')
  @Roles('admin', 'academic', 'teacher')
  @HttpCode(HttpStatus.CREATED)
  async createStudyGroup(
    @Request() req: any,
    @Body()
    dto: {
      classId: string;
      name: string;
      purpose: string;
      studentIds: string[];
    }
  ) {
    const actorId = req.user.id || req.user.userId;
    return this.academicService.createStudyGroup(
      actorId,
      dto.classId,
      dto.name,
      dto.purpose,
      dto.studentIds || []
    );
  }

  /**
   * Duyệt nhóm học tập
   */
  @Post('study-groups/:id/approve')
  @Roles('admin', 'academic')
  @HttpCode(HttpStatus.OK)
  async approveStudyGroup(@Request() req: any, @Param('id') id: string) {
    const actorId = req.user.id || req.user.userId;
    return this.academicService.approveStudyGroup(actorId, id);
  }
}
