import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) {
      throw new ForbiddenException('No user found in request');
    }

    // Verificar si el usuario tiene rol admin
    const hasAdminRole = user.roles && user.roles.includes('admin');
    
    if (!hasAdminRole) {
      throw new ForbiddenException('Access denied. Administrator privileges required.');
    }

    return true;
  }
}
