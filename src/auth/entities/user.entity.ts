
import { PortfolioItem } from "../../portfolio/entities/portfolio.entity";
import { Subscription } from "../../subscriptions/entities/subscription.entity";
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

    @OneToMany(() => Subscription, (subscription) => subscription.user)
    subscriptions: Subscription[];


    @Column({ default: false })
    reportEnabled: boolean;

    @Column({ default: 'daily' })
    reportFrequency: string; // 'daily', 'weekly', etc.

    @Column({ default: false })
    emailVerified: boolean;

    @Column({ nullable: true })
    emailVerificationToken: string;

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
