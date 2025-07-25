/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from './entities/subscription.entity';
import { User } from '../auth/entities/user.entity';
import { PortfolioItem } from '../portfolio/entities/portfolio.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PortfolioItem)
    private portfolioRepository: Repository<PortfolioItem>,
  ) {}

  // Obtener suscripción activa del usuario
  async getCurrentSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { 
        user: { id: userId }, 
        status: SubscriptionStatus.ACTIVE 
      },
      relations: ['user']
    });

    if (!subscription) {
      // Crear suscripción FREE por defecto si no existe
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const newSubscription = this.subscriptionRepository.create({
        user,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        asset_limit: 10
      });

      return await this.subscriptionRepository.save(newSubscription);
    }

    return subscription;
  }

  // Verificar límites de uso
  async getUsage(userId: string) {
    const subscription = await this.getCurrentSubscription(userId);
    const currentAssets = await this.portfolioRepository.count({
      where: { user: { id: userId } }
    });

    return {
      currentAssets,
      assetLimit: subscription.asset_limit,
      plan: subscription.plan,
      status: subscription.status,
      canAddAssets: currentAssets < subscription.asset_limit
    };
  }

  // Activar suscripción premium
  async activatePremium(userId: string, mercadopagoSubscriptionId?: string): Promise<Subscription> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Cancelar suscripción actual si existe
    await this.cancelCurrentSubscription(userId);

    // Crear nueva suscripción premium
    const premiumSubscription = this.subscriptionRepository.create({
      user,
      plan: SubscriptionPlan.PREMIUM,
      status: SubscriptionStatus.ACTIVE,
      asset_limit: 999999, // Límite muy alto para premium
      mercadopago_subscription_id: mercadopagoSubscriptionId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
    });

    return await this.subscriptionRepository.save(premiumSubscription);
  }

  // Cancelar suscripción
  async cancelSubscription(userId: string): Promise<void> {
    await this.cancelCurrentSubscription(userId);
    
    // Crear nueva suscripción FREE
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const freeSubscription = this.subscriptionRepository.create({
      user,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      asset_limit: 10
    });

    await this.subscriptionRepository.save(freeSubscription);
  }

  private async cancelCurrentSubscription(userId: string): Promise<void> {
    await this.subscriptionRepository.update(
      { 
        user: { id: userId }, 
        status: SubscriptionStatus.ACTIVE 
      },
      { status: SubscriptionStatus.CANCELLED }
    );
  }

  // Verificar si puede agregar activos
  async canAddAsset(userId: string): Promise<boolean> {
    const usage = await this.getUsage(userId);
    return usage.canAddAssets;
  }

  // Job para verificar suscripciones expiradas
  async checkExpiredSubscriptions(): Promise<void> {
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        expires_at: new Date() // Menor a la fecha actual
      }
    });

    for (const subscription of expiredSubscriptions) {
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);

      // Crear nueva suscripción FREE
      const freeSubscription = this.subscriptionRepository.create({
        user: subscription.user,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        asset_limit: 10
      });

      await this.subscriptionRepository.save(freeSubscription);
    }
  }
}
