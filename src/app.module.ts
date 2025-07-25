import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AuthModule } from './auth/auth.module';
import { NewsModule } from './news/news.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';

import { User } from './auth/entities/user.entity';
import { Asset } from './assets/entities/asset.entity';
import { PortfolioItem } from './portfolio/entities/portfolio.entity';
import { Subscription } from './subscriptions/entities/subscription.entity';
import { Payment } from './payments/entities/payment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres', // Cambia si usas otro motor
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Asset, PortfolioItem, Subscription, Payment],
      synchronize: true, // Solo true en desarrollo
    }),
    UsersModule,
    AssetsModule,
    PortfolioModule,
    AuthModule,
    NewsModule,
    SubscriptionsModule,
    PaymentsModule,
    WebhooksModule,
  ],
})
export class AppModule {}