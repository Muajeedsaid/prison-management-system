import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AuditService, sanitize } from './audit.service';

/**
 * Writes one audit entry for every request that changes data (POST, PATCH, PUT, DELETE),
 * including logins and failed logins. Plain reads (GET) are not logged.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    if (req.method === 'GET' || req.method === 'OPTIONS' || req.method === 'HEAD') return next.handle();

    const write = (statusCode: number) => {
      const body = sanitize(req.body);
      this.audit.record({
        userId: req.user?.id,
        // On a failed login there is no user yet, so keep the email that was tried.
        userEmail: req.user?.email ?? (body?.email as string | undefined),
        role: req.user?.role,
        method: req.method,
        path: req.originalUrl?.split('?')[0] ?? req.url,
        statusCode,
        ip: req.ip,
        body,
      });
    };

    return next.handle().pipe(
      tap(() => write(res.statusCode)),
      catchError((err) => {
        write(err instanceof HttpException ? err.getStatus() : 500);
        return throwError(() => err);
      }),
    );
  }
}
