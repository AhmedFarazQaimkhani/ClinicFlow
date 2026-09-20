import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      if (
        typeof payload === 'object' &&
        payload &&
        'success' in payload &&
        'error' in payload
      ) {
        response.status(status).json(payload);
        return;
      }
      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as { message?: string | string[] }).message ??
            'Request failed.');
      response.status(status).json({
        success: false,
        error: {
          code: status === 401 ? 'UNAUTHORIZED' : 'REQUEST_FAILED',
          message: Array.isArray(message) ? message.join(', ') : message,
        },
      });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.message : 'Unhandled error',
    );
    if (
      typeof exception === 'object' &&
      exception &&
      'code' in exception &&
      (exception as { code?: string }).code === 'P2002'
    ) {
      response.status(HttpStatus.CONFLICT).json({
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'This record already exists.',
        },
      });
      return;
    }
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again.',
      },
    });
  }
}
