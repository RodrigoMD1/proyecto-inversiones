import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from 'src/subscriptions/entities/subscription.entity';
import { PortfolioItem } from 'src/portfolio/entities/portfolio.entity';

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  roles: string[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  currentSubscription: {
    plan: string;
    status: string;
    assetLimit: number;
    expiresAt?: Date;
  };
  portfolioStats: {
    totalAssets: number;
    lastActivity?: Date;
  };
}

export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  activeSubscriptions: number;
  freeUsers: number;
  premiumUsers: number;
  totalAssets: number;
}

@Injectable()
export class AdminService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(PortfolioItem)
    private readonly portfolioRepository: Repository<PortfolioItem>,
  ) {}

  // Obtener estadísticas generales del panel admin
  async getAdminStats(): Promise<AdminStats> {
    const totalUsers = await this.userRepository.count();
    const verifiedUsers = await this.userRepository.count({ 
      where: { emailVerified: true } 
    });

    const subscriptions = await this.subscriptionRepository.find({
      where: { status: SubscriptionStatus.ACTIVE }
    });

    const activeSubscriptions = subscriptions.length;
    const premiumUsers = subscriptions.filter(s => s.plan === SubscriptionPlan.PREMIUM).length;
    const freeUsers = totalUsers - premiumUsers;
    const totalAssets = await this.portfolioRepository.count();

    return {
      totalUsers,
      verifiedUsers,
      activeSubscriptions,
      freeUsers,
      premiumUsers,
      totalAssets,
    };
  }

  // Obtener lista completa de usuarios con información detallada
  async getAllUsers(): Promise<UserSummary[]> {
    const users = await this.userRepository.find({
      relations: ['subscriptions', 'portfolio'],
      order: { name: 'ASC' },
    });

    const userSummaries: UserSummary[] = [];

    for (const user of users) {
      // Buscar suscripción activa
      const activeSubscription = user.subscriptions?.find(
        sub => sub.status === SubscriptionStatus.ACTIVE
      );

      const subscriptionInfo = activeSubscription || {
        plan: 'FREE',
        status: 'ACTIVE',
        asset_limit: 10,
        expires_at: undefined,
      };

      // Estadísticas del portfolio
      const totalAssets = user.portfolio?.length || 0;
      const lastActivity = user.portfolio?.length > 0 
        ? new Date(Math.max(...user.portfolio.map(p => new Date(p.purchase_date).getTime())))
        : undefined;

      userSummaries.push({
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: new Date(), // TypeORM no incluye createdAt por defecto
        currentSubscription: {
          plan: subscriptionInfo.plan,
          status: subscriptionInfo.status,
          assetLimit: subscriptionInfo.asset_limit,
          expiresAt: subscriptionInfo.expires_at,
        },
        portfolioStats: {
          totalAssets,
          lastActivity,
        },
      });
    }

    return userSummaries;
  }

  // Cambiar el plan de suscripción de un usuario
  async updateUserSubscription(
    userId: string, 
    newPlan: 'FREE' | 'PREMIUM'
  ): Promise<{ message: string; subscription: any }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['subscriptions'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Buscar suscripción activa actual
    const currentSubscription = user.subscriptions?.find(
      sub => sub.status === SubscriptionStatus.ACTIVE
    );

    const planEnum = newPlan === 'PREMIUM' ? SubscriptionPlan.PREMIUM : SubscriptionPlan.FREE;

    if (currentSubscription) {
      // Actualizar suscripción existente
      currentSubscription.plan = planEnum;
      currentSubscription.asset_limit = newPlan === 'PREMIUM' ? 999999 : 10;
      
      if (newPlan === 'PREMIUM') {
        // Extender por 1 año desde ahora
        currentSubscription.expires_at = new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        );
      } else {
        currentSubscription.expires_at = null;
      }

      await this.subscriptionRepository.save(currentSubscription);

      return {
        message: `Suscripción actualizada a ${newPlan}`,
        subscription: currentSubscription,
      };
    } else {
      // Crear nueva suscripción
      const newSubscription = this.subscriptionRepository.create({
        user: user,
        plan: planEnum,
        status: SubscriptionStatus.ACTIVE,
        asset_limit: newPlan === 'PREMIUM' ? 999999 : 10,
        expires_at: newPlan === 'PREMIUM' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : null,
      });

      await this.subscriptionRepository.save(newSubscription);

      return {
        message: `Nueva suscripción ${newPlan} creada`,
        subscription: newSubscription,
      };
    }
  }

  // Activar/desactivar usuario
  async toggleUserStatus(userId: string): Promise<{ message: string; user: User }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = !user.isActive;
    await this.userRepository.save(user);

    return {
      message: `Usuario ${user.isActive ? 'activado' : 'desactivado'}`,
      user: user,
    };
  }

  // Verificar email de usuario manualmente
  async verifyUserEmail(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await this.userRepository.save(user);

    return {
      message: `Email de ${user.email} verificado manualmente`,
    };
  }

  // Eliminar usuario completamente
  async deleteUser(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['subscriptions', 'portfolio'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // No permitir eliminar usuarios admin (excepto si eres super admin)
    if (user.roles.includes('admin')) {
      throw new Error('No se puede eliminar un usuario administrador');
    }

    try {
      // TypeORM se encargará de las relaciones en cascada si están configuradas
      // Si no, tendríamos que eliminar manualmente las relaciones
      
      // Eliminar suscripciones del usuario
      if (user.subscriptions && user.subscriptions.length > 0) {
        await this.subscriptionRepository.remove(user.subscriptions);
      }

      // Eliminar items del portfolio
      if (user.portfolio && user.portfolio.length > 0) {
        await this.portfolioRepository.remove(user.portfolio);
      }

      // Finalmente eliminar el usuario
      await this.userRepository.remove(user);

      return {
        message: `Usuario ${user.email} eliminado exitosamente junto con todos sus datos`,
      };

    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }

  // Cambiar rol de usuario (para hacer admin desde el panel)
  async updateUserRole(userId: string, newRoles: string[]): Promise<{ message: string; user: any }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.roles = newRoles;
    await this.userRepository.save(user);

    return {
      message: `Roles de ${user.email} actualizados: ${newRoles.join(', ')}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    };
  }
}
