import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map(
        (data: { message?: string; data?: T } | T) =>
          ({
            success: true,
            statusCode: response.statusCode,
            message:
              typeof data === 'object' && data !== null && 'message' in data
                ? (data as { message: string }).message
                : 'Request successful',
            data:
              typeof data === 'object' && data !== null && 'data' in data
                ? (data as { data: T }).data
                : data,
            timestamp: new Date().toISOString(),
          }) as ApiResponse<T>,
      ),
    );
  }
}
