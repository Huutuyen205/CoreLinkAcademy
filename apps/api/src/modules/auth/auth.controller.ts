import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ConsentRequest,
  AuthUserResponse,
} from '@corelink/shared';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập đa kênh (SĐT, Email, Username)' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Sai thông tin hoặc mật khẩu tạm hết hạn' })
  @ApiResponse({ status: 403, description: 'Tài khoản bị khóa' })
  async login(
    @Body() body: LoginRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(
      body.credential,
      body.password,
      body.twoFactorCode,
    );
    return this.authService.login(user, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới Access Token thông qua Refresh Token xoay vòng' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    return this.authService.refreshAccessToken(token, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất khỏi thiết bị hiện tại hoặc tất cả' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    await this.authService.logout(token);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    return { message: 'Đăng xuất thành công' };
  }

  @Post('password/change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đổi mật khẩu người dùng' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: ChangePasswordRequest,
  ) {
    await this.authService.changePassword(userId, body.currentPassword, body.newPassword);
    return { message: 'Đổi mật khẩu thành công' };
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yêu cầu đặt lại mật khẩu qua email' })
  async forgotPassword(@Body() body: ForgotPasswordRequest) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu với token' })
  async resetPassword(@Body() body: ResetPasswordRequest) {
    await this.authService.resetPassword(body.token, body.newPassword);
    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  async getMe(@CurrentUser() user: AuthUserResponse) {
    return user;
  }

  @Post('consents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xác nhận đồng ý chính sách xử lý dữ liệu (FR-209)' })
  async giveConsent(
    @CurrentUser('id') userId: string,
    @Body() body: ConsentRequest,
    @Req() req: Request,
  ) {
    const consent = await this.prisma.consents.create({
      data: {
        user_id: userId,
        scope: body.scope,
        policy_version: body.policyVersion || 'v1.0',
        subject_student_id: body.subjectStudentId,
        ip_address: req.ip || '127.0.0.1',
      },
    });
    return { message: 'Đã ghi nhận đồng ý chính sách', consentId: consent.id };
  }

  @Post('consents/withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rút đồng ý xử lý dữ liệu (FR-209)' })
  async withdrawConsent(
    @CurrentUser('id') userId: string,
    @Body('scope') scope: 'data_processing' | 'ai_processing' | 'photo_public' | 'marketing',
  ) {
    await this.prisma.consents.updateMany({
      where: {
        user_id: userId,
        scope,
        withdrawn_at: null,
      },
      data: {
        withdrawn_at: new Date(),
      },
    });

    // Ghi audit_logs theo A6.8
    await this.prisma.audit_logs.create({
      data: {
        actor_id: userId,
        action: 'consent.withdraw',
        entity: 'consents',
        reason: `Người dùng rút đồng ý quyền ${scope}`,
      },
    });

    return { message: 'Đã rút đồng ý và tạo thông báo xử lý cho Quản trị viên' };
  }
}
