import 'dotenv/config';
import { DataSource } from 'typeorm';
import { PortfolioItem } from './portfolio/entities/portfolio.entity';
import { User } from './auth/entities/user.entity';
import { Subscription } from './subscriptions/entities/subscription.entity';
import { Payment } from './payments/entities/payment.entity'; 

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [PortfolioItem, User, Subscription, Payment], // <--- Agregadas las nuevas entidades
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  synchronize: false,
});