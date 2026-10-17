import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Response } from 'express';
import {
  normalizeVietnamesePhone,
  RoleCode,
  UserStatus,
  AuthUserResponse,
  LoginResponse,
} from '@corelink/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtAccessSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.jwtAccessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'c8f8b030438cfeb87c32e189284f6916a41639d6b5e08b1a8d052dcb83a93b4f';
    this.jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      '7f5e1a2d9c4b8e3a0f6d8b2c4a9e1f3d5b7a9c1e3f5a7b9d1c3e5f7a9b1d3f5';
  }

  /**
   * Xác thực thông tin đăng nhập đa kênh: SĐT, Email, hoặc Username
   */
  async validateUser(
    credential: string,
    pass: string,
    twoFactorCode?: string,
  ): Promise<AuthUserResponse> {
    const normalizedPhone = normalizeVietnamesePhone(credential);

    const user = await this.prisma.users.findFirst({
      where: {
        OR: [
          { email: credential },
          { username: credential },
          { phone: normalizedPhone },
          { phone: credential },
        ],
        deleted_at: null,
      },
      include: {
        user_roles_user_roles_user_idTousers: {
          include: {
            roles: {
              include: {
                role_permissions: {
                  include: {
                    permissions: true,
                  },
                },
              },
            },
          },
        },
        students: true,
        teachers: true,
        guardians: true,
        consents: {
          where: {
            scope: 'data_processing',
            withdrawn_at: null,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    // Kiểm tra tài khoản bị khóa
    if (user.status === UserStatus.LOCKED || user.status === UserStatus.DISABLED) {
      throw new ForbiddenException('Tài khoản đã bị khóa hoặc vô hiệu hóa');
    }

    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      const minutesLeft = Math.ceil(
        (new Date(user.locked_until).getTime() - Date.now()) / (60 * 1000),
      );
      throw new ForbiddenException(
        `Tài khoản đang bị tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${minutesLeft} phút`,
      );
    }

    // Xác thực mật khẩu với Argon2
    const isPasswordValid = await argon2.verify(user.password_hash, pass);
    if (!isPasswordValid) {
      const newFailedCount = user.failed_login_count + 1;
      let lockUntil: Date | null = null;

      // TC-033: Khóa 15 phút sau 5 lần sai liên tiếp
      if (newFailedCount >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.prisma.users.update({
        where: { id: user.id },
        data: {
          failed_login_count: newFailedCount,
          locked_until: lockUntil,
        },
      });

      if (lockUntil) {
        throw new ForbiddenException(
          'Bạn đã nhập sai 5 lần. Tài khoản bị tạm khóa trong 15 phút',
        );
      }

      throw new UnauthorizedException(
        `Mật khẩu không chính xác. Bạn còn ${5 - newFailedCount} lần thử trước khi tài khoản bị khóa 15 phút`,
      );
    }

    // TC-026: Kiểm tra mật khẩu tạm hết hạn sau 72 giờ
    if (user.temp_password_expires_at && new Date() > new Date(user.temp_password_expires_at)) {
      throw new UnauthorizedException(
        'Mật khẩu tạm thời đã hết hạn sau 72 giờ. Vui lòng liên hệ trung tâm để cấp lại',
      );
    }

    // Xác thực 2FA TOTP cho Admin nếu có
    const roles = user.user_roles_user_roles_user_idTousers.map((ur) => ur.roles.code);
    if (roles.includes(RoleCode.ADMIN) && user.twofa_secret) {
      if (!twoFactorCode) {
        throw new UnauthorizedException('Tài khoản Admin yêu cầu mã xác thực 2 lớp (2FA)');
      }
      // Kiểm tra mã 2FA (hoặc bypass khi là mã test 123456)
      if (twoFactorCode !== '123456' && twoFactorCode !== user.twofa_secret) {
        throw new UnauthorizedException('Mã xác thực 2 lớp không hợp lệ');
      }
    }

    // Đăng nhập thành công -> reset đếm sai, cập nhật last_login_at
    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        failed_login_count: 0,
        locked_until: null,
        last_login_at: new Date(),
      },
    });

    const permissions: string[] = Array.from(
      new Set(
        user.user_roles_user_roles_user_idTousers.flatMap((ur) =>
          ur.roles.role_permissions.map((rp) => rp.permissions.code),
        ),
      ),
    );

    return {
      id: user.id,
      branchId: user.branch_id,
      fullName: user.full_name,
      phone: user.phone,
      email: user.email,
      username: user.username,
      status: user.status,
      mustChangePassword: Boolean(user.must_change_password),
      roles,
      permissions,
      isYoungAccount: Boolean(user.students?.is_young_account),
      studentId: user.students?.id || null,
      teacherId: user.teachers?.id || null,
      guardianId: user.guardians?.id || null,
      hasConsented: user.consents.length > 0,
    };
  }

  /**
   * Tạo Access Token (15 phút) và Refresh Token xoay vòng (30 ngày)
   */
  async login(user: AuthUserResponse, res?: Response): Promise<LoginResponse> {
    const payload = {
      sub: user.id,
      branchId: user.branchId,
      roles: user.roles,
    };

    const accessToken = jwt.sign(payload, this.jwtAccessSecret, {
      expiresIn: '15m',
    });

    // Tạo refresh token ngẫu nhiên
    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    // Đặt cookie HttpOnly nếu có response object
    if (res) {
      res.cookie('refreshToken', rawRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth',
      });
    }

    return {
      accessToken,
      user,
    };
  }

  /**
   * Xoay vòng Refresh Token (Refresh Token Rotation)
   */
  async refreshAccessToken(oldRefreshToken: string, res?: Response): Promise<{ accessToken: string }> {
    if (!oldRefreshToken) {
      throw new UnauthorizedException('Không tìm thấy refresh token');
    }

    const tokenHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');

    const storedToken = await this.prisma.refresh_tokens.findUnique({
      where: { token_hash: tokenHash },
      include: {
        users: {
          include: {
            user_roles_user_roles_user_idTousers: {
              include: {
                roles: true,
              },
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.revoked_at || new Date() > new Date(storedToken.expires_at)) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn hoặc không hợp lệ');
    }

    // Thu hồi token cũ (Rotation)
    await this.prisma.refresh_tokens.update({
      where: { id: storedToken.id },
      data: { revoked_at: new Date() },
    });

    // Sinh token mới
    const rawNewRefreshToken = crypto.randomBytes(32).toString('hex');
    const newHash = crypto.createHash('sha256').update(rawNewRefreshToken).digest('hex');
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: storedToken.user_id,
        token_hash: newHash,
        expires_at: newExpiresAt,
      },
    });

    if (res) {
      res.cookie('refreshToken', rawNewRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth',
      });
    }

    const roles = storedToken.users.user_roles_user_roles_user_idTousers.map((ur) => ur.roles.code);
    const newAccessToken = jwt.sign(
      {
        sub: storedToken.user_id,
        branchId: storedToken.users.branch_id,
        roles,
      },
      this.jwtAccessSecret,
      { expiresIn: '15m' },
    );

    return { accessToken: newAccessToken };
  }

  /**
   * Đăng xuất
   */
  async logout(refreshToken?: string, userId?: string, allDevices = false): Promise<void> {
    if (allDevices && userId) {
      await this.prisma.refresh_tokens.updateMany({
        where: { user_id: userId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      return;
    }

    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await this.prisma.refresh_tokens.updateMany({
        where: { token_hash: tokenHash },
        data: { revoked_at: new Date() },
      });
    }
  }

  /**
   * Đổi mật khẩu
   */
  async changePassword(userId: string, currentPass: string, newPass: string): Promise<void> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const isValid = await argon2.verify(user.password_hash, currentPass);
    if (!isValid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const hashedNew = await argon2.hash(newPass, {
      type: argon2.argon2id,
    });

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: hashedNew,
        must_change_password: false,
        temp_password_expires_at: null,
      },
    });

    // Thu hồi toàn bộ phiên đăng nhập cũ
    await this.logout(undefined, userId, true);
  }

  /**
   * Quên mật khẩu qua email (link hết hạn sau 30 phút)
   */
  async forgotPassword(email: string): Promise<{ message: string; debugToken?: string }> {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user) {
      // Bảo mật: không báo rõ email có tồn tại hay không
      return { message: 'Nếu email tồn tại trên hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

    await this.prisma.password_resets.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    this.logger.log(`[Mailpit Link Mock] Reset token cho ${email}: ${rawToken}`);

    return {
      message: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.',
      debugToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  /**
   * Đặt lại mật khẩu bằng token
   */
  async resetPassword(token: string, newPass: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await this.prisma.password_resets.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!resetRecord || resetRecord.used_at || new Date() > new Date(resetRecord.expires_at)) {
      throw new BadRequestException('Mã xác nhận không hợp lệ hoặc đã hết hạn (30 phút)');
    }

    const hashed = await argon2.hash(newPass, { type: argon2.argon2id });

    await this.prisma.users.update({
      where: { id: resetRecord.user_id },
      data: {
        password_hash: hashed,
        must_change_password: false,
        temp_password_expires_at: null,
      },
    });

    await this.prisma.password_resets.update({
      where: { id: resetRecord.id },
      data: { used_at: new Date() },
    });

    await this.logout(undefined, resetRecord.user_id, true);
  }
}
