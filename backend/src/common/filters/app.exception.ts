import { HttpException } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status = 400,
  ) {
    super({ success: false, error: { code, message } }, status);
  }
}
