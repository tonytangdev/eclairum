import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { UserAlreadyExistsError } from '@flash-me/core/errors';

@Catch(UserAlreadyExistsError)
export class DomainExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof UserAlreadyExistsError) {
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: exception.message,
        error: 'Conflict',
      });
    }

    // Default fallback for other domain errors that might be added later
    const errorMessage =
      exception instanceof Error ? exception.message : 'Bad Request';
    return response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: errorMessage,
      error: 'Bad Request',
    });
  }
}
