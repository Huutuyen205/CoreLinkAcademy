import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUserResponse } from '@corelink/shared';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUserResponse | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
