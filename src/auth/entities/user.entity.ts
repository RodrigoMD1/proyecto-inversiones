
import { PortfolioItem } from "../../portfolio/entities/portfolio.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn, } from "typeorm";




@Entity('users')
export class User {


    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { unique: true })
    email: string;

    @Column('text', { select: false })
    password: string;

    @Column('text')
    name: string;

    @Column('bool', { default: true })
    isActive: boolean;

    @Column('text', { array: true, default: ['user'] })
    roles: string[];

    @OneToMany(() => PortfolioItem, (item) => item.user)
portfolio: PortfolioItem[];

    /////////////////////////////////////////////////////


    @BeforeInsert()
    checkFieldsBeforInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkfieldsBeforUpdate() {
        this.checkFieldsBeforInsert();
    }

}
