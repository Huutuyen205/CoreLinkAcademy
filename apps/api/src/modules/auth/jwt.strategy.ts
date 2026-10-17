import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserResponse, UserStatus } from '@corelink/shared';

export interface JwtPayload {
  sub: string;
  branchId: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'default_jwt_access_secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUserResponse> {
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
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

    if (!user || user.status !== UserStatus.ACTIVE || user.deleted_at !== null) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    const roles = user.user_roles_user_roles_user_idTousers.map((ur) => ur.roles.code);
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
}
