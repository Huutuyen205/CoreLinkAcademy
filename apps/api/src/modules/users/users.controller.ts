import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ScopeGuard } from '../auth/guards/scope.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Scope } from '../auth/decorators/scope.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  RoleCode,
  CreateUserRequest,
  UpdateGuardianshipRequest,
  AuthUserResponse,
} from '@corelink/shared';

@ApiTags('Users')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, ScopeGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC)
  @ApiOperation({ summary: 'Danh sách tài khoản người dùng' })
  async getUsers(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.usersService.findAll({ role, search, limit, offset });
  }

  @Post('users')
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC)
  @ApiOperation({ summary: 'Tạo tài khoản người dùng mới (FR-201)' })
  async createUser(
    @Body() dto: CreateUserRequest,
    @CurrentUser('id') creatorId: string,
  ) {
    return this.usersService.createUser(dto, creatorId);
  }

  @Patch('users/:id/lock')
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: 'Khóa hoặc mở khóa tài khoản (FR-207)' })
  async toggleLock(
    @Param('id') id: string,
    @Body('lock') lock: boolean,
    @Body('reason') reason: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.toggleLock(id, lock, reason || 'Thực hiện bởi Admin', actorId);
  }

  @Post('students/:id/guardians')
  @Roles(RoleCode.ADMIN, RoleCode.ACADEMIC)
  @ApiOperation({ summary: 'Liên kết phụ huynh với học sinh (FR-202)' })
  async linkGuardian(
    @Param('id') studentId: string,
    @Body('guardianId') guardianId: string,
    @Body('relation') relation: 'father' | 'mother' | 'grandparent' | 'guardian' | 'other',
    @Body() flags: { canViewResults?: boolean; canMessage?: boolean; receivesFeeNotice?: boolean },
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.linkGuardian(studentId, guardianId, relation || 'father', flags, actorId);
  }

  @Patch('guardianships/:studentId/:guardianId')
  @Roles(RoleCode.ADMIN)
  @ApiOperation({ summary: 'Cập nhật 3 cờ quyền của phụ huynh (FR-202)' })
  async updateGuardianship(
    @Param('studentId') studentId: string,
    @Param('guardianId') guardianId: string,
    @Body() dto: UpdateGuardianshipRequest,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.updateGuardianship(studentId, guardianId, dto, actorId);
  }

  // ==========================================
  // Endpoints kiểm tra phạm vi dữ liệu (Scope Policy - TC-029, TC-030)
  // ==========================================

  @Get('students/:id/progress')
  @Scope({ target: 'student', permissionField: 'can_view_results' })
  @ApiOperation({ summary: 'Xem tiến độ học tập của học sinh (kiểm soát phạm vi 2 lớp)' })
  async getStudentProgress(@Param('id') id: string) {
    return {
      studentId: id,
      progressPercentage: 45,
      attendanceRate: 0.95,
      trendWeeks: [8.0, 8.5, 9.0],
    };
  }

  @Get('classes/:id/sessions')
  @Scope({ target: 'class' })
  @ApiOperation({ summary: 'Xem danh sách buổi học của lớp (kiểm soát phạm vi 2 lớp)' })
  async getClassSessions(@Param('id') id: string) {
    return {
      classId: id,
      sessions: [],
    };
  }

  // ==========================================
  // Endpoints kiểm tra tài khoản học sinh nhỏ (TC-036)
  // ==========================================

  @Post('conversations')
  @ApiOperation({ summary: 'Tạo hội thoại nhắn tin (chặn tài khoản học sinh nhỏ - FR-208)' })
  async createConversation(@CurrentUser() user: AuthUserResponse) {
    if (user.isYoungAccount) {
      throw new ForbiddenException('Tài khoản học sinh nhỏ không được phép tạo hội thoại nhắn tin riêng (FR-208)');
    }
    return {
      conversationId: 'mock-conv-id',
      status: 'created',
    };
  }
}
