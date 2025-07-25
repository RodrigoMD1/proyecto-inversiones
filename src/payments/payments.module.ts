import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './entities/payment.entity';
import { User } from '../auth/entities/user.entity';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService, TypeOrmModule],
})
export class PaymentsModule {}
