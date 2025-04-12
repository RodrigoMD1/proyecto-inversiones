import { Column, PrimaryGeneratedColumn } from "typeorm";
//import { PortfolioItem } from '../../portfolio/entities/portfolio-item.entity'; //* esto para cuando este el modulo de assets 



export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    name: string;

    @Column()
    password: string; // Esto va encriptado si metés auth después

    // @OneToMany(() => PortfolioItem, (item) => item.user)
    // portfolio: PortfolioItem[];


}
