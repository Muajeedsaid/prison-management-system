import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './guards';
import { Role } from './roles';

function makeContext(user: any, required?: Role[], isPublic = false) {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
    if (key === 'isPublic') return isPublic;
    if (key === 'roles') return required;
    return undefined;
  });
  const ctx = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  return { guard: new RolesGuard(reflector), ctx };
}

describe('RolesGuard', () => {
  it('lets a route without @Roles() through for any logged-in user', () => {
    const { guard, ctx } = makeContext({ role: Role.CELL }, undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows a role that is on the list', () => {
    const { guard, ctx } = makeContext({ role: Role.RECORDS }, [Role.RECORDS]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects a role that is not on the list with 403', () => {
    const { guard, ctx } = makeContext({ role: Role.CELL }, [Role.RECORDS]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('skips the check on public routes', () => {
    const { guard, ctx } = makeContext(undefined, [Role.ADMIN], true);
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
