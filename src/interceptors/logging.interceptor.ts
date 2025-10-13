import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Solo loguear POST a /api/portfolio
    if (request.method === 'POST' && request.url?.includes('/portfolio')) {
      console.log('\n🔍 === INTERCEPTOR RAW DATA ===');
      console.log('📍 URL:', request.url);
      console.log('📍 Method:', request.method);
      console.log('📍 Body RAW:', JSON.stringify(request.body, null, 2));
      console.log('📍 Content-Type:', request.headers['content-type']);
      console.log('🔍 === END RAW DATA ===\n');
    }

    return next.handle();
  }
}
