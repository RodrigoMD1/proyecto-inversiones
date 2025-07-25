import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription } from './entities/subscription.entity';
import { User } from '../auth/entities/user.entity';
import { PortfolioItem } from '../portfolio/entities/portfolio.entity';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, User, PortfolioItem]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService, TypeOrmModule],
})
export class SubscriptionsModule {}
