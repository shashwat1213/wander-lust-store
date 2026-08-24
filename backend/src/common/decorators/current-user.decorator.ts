import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export type AuthUser = Omit<User, 'password'>;

/**
 * Extracts the authenticated user (populated by JwtAuthGuard) from the request.
 * Usage: `@CurrentUser() user: AuthUser`
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;
    return data ? user?.[data] : user;
  },
);
