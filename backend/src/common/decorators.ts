import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role } from './roles';

export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

/** Restrict a route to the listed roles. A route without @Roles() is open to any logged-in user. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Skip authentication for a route (login, refresh, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

/** Inject the logged-in user into a controller method. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});
