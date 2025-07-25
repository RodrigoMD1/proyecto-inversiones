import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class AssetLimitGuard implements CanActivate {
  constructor(private subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('🛡️ AssetLimitGuard - User:', user ? user.id : 'No user');

    if (!user) {
      console.log('🛡️ AssetLimitGuard - No user found, allowing (will be handled by AuthGuard)');
      return true; // Cambiamos de false a true
    }

    // Verificar que el email esté verificado
    if (!user.emailVerified) {
      console.log('🛡️ AssetLimitGuard - Email not verified for user:', user.id);
      throw new ForbiddenException('Debes verificar tu email antes de poder agregar activos. Revisa tu bandeja de entrada o solicita un nuevo código de verificación.');
    }

    console.log('🛡️ AssetLimitGuard - Checking canAddAsset for user:', user.id);
    const canAddAsset = await this.subscriptionsService.canAddAsset(user.id);
    console.log('🛡️ AssetLimitGuard - Can add asset:', canAddAsset);
    
    if (!canAddAsset) {
      console.log('🛡️ AssetLimitGuard - Blocking asset creation due to limit');
      throw new ForbiddenException('Has alcanzado el límite de activos de tu plan. Actualiza a Premium para agregar más activos.');
    }

    console.log('🛡️ AssetLimitGuard - Allowing asset creation');
    return true;
  }
}
