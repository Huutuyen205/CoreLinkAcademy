import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleCode, AuthUserResponse } from '@corelink/shared';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(RoleCode | string)[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user }: { user: AuthUserResponse } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Truy cập bị từ chối');
    }

    // Admin có toàn quyền
    if (user.roles.includes(RoleCode.ADMIN)) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Bạn không có vai trò cần thiết để thực hiện thao tác này');
    }

    return true;
  }
}
