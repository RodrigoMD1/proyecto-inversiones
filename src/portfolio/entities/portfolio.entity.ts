import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Asegúrate de importar la entidad User

@Entity('portfolio_items')
export class PortfolioItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Nombre del activo (ej. 'Tesla', 'Bitcoin')

  @Column('text')
  description: string; // Descripción del activo (ej. 'Acción de Tesla', 'Bitcoin')

  @Column()
  type: string; // Tipo de activo (ej. 'Stock', 'Cryptocurrency', 'Bond', etc.)

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number; // Cantidad de este activo (ej. 10 acciones de Tesla, 5 BTC)

  @Column('decimal', { precision: 10, scale: 2 })
  purchase_price: number; // Precio de compra por unidad del activo

  @ManyToOne(() => User, (user) => user.portfolio, { eager: true })
@JoinColumn({ name: 'user_id' })
user: User; 
}