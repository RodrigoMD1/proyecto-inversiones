import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class AssetLimitGuard implements CanActivate {
  constructor(private subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Será manejado por AuthGuard
    }

    // Verificar email (desactivado temporalmente para desarrollo)
    if (!user.emailVerified) {
      // Solo log en desarrollo, no bloquear
    }

    const canAddAsset = await this.subscriptionsService.canAddAsset(user.id);
    
    if (!canAddAsset) {
      throw new ForbiddenException('Has alcanzado el límite de activos de tu plan. Actualiza a Premium para agregar más activos.');
    }

    return true;
  }
}
