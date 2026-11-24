import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

/**
 * One error shape for the whole API:
 * { statusCode, error, message }
 * Unexpected failures are logged on the server and hidden from the client (500).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = typeof body === 'string' ? body : (body as any).message ?? exception.message;
      const error = typeof body === 'string' ? exception.name : (body as any).error ?? exception.name;
      return res.status(status).json({ statusCode: status, error, message });
    }

    // Mongo duplicate key (e.g. email already registered)
    if ((exception as any)?.code === 11000) {
      const fields = Object.keys((exception as any).keyPattern ?? {}).join(', ');
      return res
        .status(HttpStatus.CONFLICT)
        .json({ statusCode: 409, error: 'Conflict', message: `Duplicate value for: ${fields}` });
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ statusCode: 500, error: 'Internal Server Error', message: 'Something went wrong' });
  }
}
