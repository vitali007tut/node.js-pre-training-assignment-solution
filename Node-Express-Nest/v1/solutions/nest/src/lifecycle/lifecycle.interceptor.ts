import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LifecycleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    console.log(
      `[Lifecycle] Interceptor: before handler (${request.method} ${request.url})`,
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        console.log(
          `[Lifecycle] Interceptor: after handler (${duration}ms)`,
        );
      }),
    );
  }
}
