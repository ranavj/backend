import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total') public counter: Counter<string>
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 👇 FIX: Pehle check karo ki context type 'http' hai ya nahi
    if (context.getType() !== 'http') {
      return next.handle(); // GraphQL/Socket ko jaane do, mat gino
    }

    const req = context.switchToHttp().getRequest();
    
    // 👇 Extra Safety: Agar req object hi nahi hai toh return karo
    if (!req) {
        return next.handle();
    }

    const { method, url } = req;

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const statusCode = res.statusCode;

        if (url !== '/metrics') {
            this.counter.inc({ method, path: url, status: statusCode });
        }
      }),
    );
  }
}