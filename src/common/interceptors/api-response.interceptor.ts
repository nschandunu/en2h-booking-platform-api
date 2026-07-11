import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((res) => {
        // If the response is already in the standardized format, just return it
        if (res && typeof res === 'object' && 'success' in res && 'message' in res) {
          return res;
        }

        // If the controller returned { message, data }, format it
        if (res && typeof res === 'object' && res.message && res.data !== undefined) {
          return {
            success: true,
            message: res.message,
            data: res.data,
          };
        }

        // Default wrapping for any other data
        return {
          success: true,
          message: 'Request completed successfully',
          data: res,
        };
      }),
    );
  }
}
