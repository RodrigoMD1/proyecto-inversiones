import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column()
  mercadopago_payment_id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  preference_id: string;

  @CreateDateColumn()
  created_at: Date;
}
