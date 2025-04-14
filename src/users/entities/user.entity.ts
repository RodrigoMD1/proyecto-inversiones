import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PortfolioItem } from '../../portfolio/entities/portfolio.entity'; // Verifica que la ruta sea correcta
import { Exclude } from 'class-transformer';


@Entity()
export class User {

  @PrimaryGeneratedColumn() // Deberías usar uuid si quieres ids tipo UUID
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  @Exclude()
  password: string; // Aquí es importante encriptar la contraseña cuando implemente la autenticación

  @OneToMany(() => PortfolioItem, (item) => item.user)
  portfolio: PortfolioItem[];
}