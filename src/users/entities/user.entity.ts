import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
// import { PortfolioItem } from '../../portfolio/entities/portfolio-item.entity'; //* esto lo descomentás cuando tengas el módulo de assets

@Entity() // Esto indica que la clase es una entidad
export class User {

    @PrimaryGeneratedColumn() // Deberías usar uuid si quieres ids tipo UUID
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    name: string;

    @Column()
    password: string; // Aquí es importante encriptar la contraseña cuando implemente la autenticación

    // @OneToMany(() => PortfolioItem, (item) => item.user)
    // portfolio: PortfolioItem[];

}