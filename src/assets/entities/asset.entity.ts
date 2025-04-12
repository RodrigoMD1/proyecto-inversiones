import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';


@Entity()

export class Asset {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    symbol: string;  // Ej: BTC, ETH, AAPL

    @Column()
    name: string;    // Ej: Bitcoin, Ethereum, Apple Inc.

    @Column()
    type: 'crypto' | 'stock' | 'forex';  // Tipo de activo

    @Column({ nullable: true })
    description: string; // Descripción opcional


}
