import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SubscriptionPlan } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({ 
    description: 'Plan de suscripción',
    enum: SubscriptionPlan,
    example: SubscriptionPlan.PREMIUM
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({ 
    description: 'ID de suscripción de MercadoPago',
    required: false
  })
  @IsOptional()
  mercadopago_subscription_id?: string;
}
