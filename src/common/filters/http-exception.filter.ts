import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = exceptionResponse.message || exception.message;
        // Handle class-validator error arrays
        if (Array.isArray(exceptionResponse.message)) {
          message = 'Validation failed';
          errors = exceptionResponse.message;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma Unique Constraint violation
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'A record with this value already exists.';
        // Extract the field that caused the conflict
        const target = exception.meta?.target;
        if (Array.isArray(target) && target.length > 0) {
          message = `A record with this ${target[0]} already exists.`;
          errors = [{ field: target[0], message: 'Must be unique' }];
        }
      }
    } else if (exception instanceof Error) {
      // Fallback for other unhandled runtime errors
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      message,
      errors: errors.length > 0 ? errors : undefined,
    });
  }
}
