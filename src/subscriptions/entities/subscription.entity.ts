import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

export enum SubscriptionPlan {
  FREE = 'free',
  PREMIUM = 'premium'
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
  plan: SubscriptionPlan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({ nullable: true })
  mercadopago_subscription_id: string;

  @Column({ default: 10 }) // Límite de activos para plan FREE
  asset_limit: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
