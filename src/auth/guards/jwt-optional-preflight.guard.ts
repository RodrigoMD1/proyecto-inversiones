import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard personalizado que permite peticiones OPTIONS (CORS preflight)
 * pero requiere autenticación JWT para todo lo demás
 */
@Injectable()
export class JwtOptionalPreflightGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Si es una petición OPTIONS (CORS preflight), permitirla sin autenticación
    if (request.method === 'OPTIONS') {
      return true;
    }
    
    // Para cualquier otro método, usar la validación JWT normal
    return super.canActivate(context);
  }
}
