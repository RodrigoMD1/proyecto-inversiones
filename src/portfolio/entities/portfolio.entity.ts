import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('portfolio_items')
export class PortfolioItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  type: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  purchase_price: number;

  @Column({ type: 'timestamp', nullable: false }) // <-- NUEVO CAMPO
  purchase_date: Date;

  @ManyToOne(() => User, (user) => user.portfolio, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  ticker: string;
}