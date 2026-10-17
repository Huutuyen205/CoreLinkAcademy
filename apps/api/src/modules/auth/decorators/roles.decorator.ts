import { SetMetadata } from '@nestjs/common';
import { RoleCode } from '@corelink/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (RoleCode | string)[]) => SetMetadata(ROLES_KEY, roles);
