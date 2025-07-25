import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(AuthGuard())
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @ApiResponse({ status: 200, description: 'Suscripción actual del usuario' })
  async getCurrentSubscription(@GetUser() user: User) {
    return await this.subscriptionsService.getCurrentSubscription(user.id);
  }

  @Get('usage')
  @ApiResponse({ status: 200, description: 'Límites y uso actual del usuario' })
  async getUsage(@GetUser() user: User) {
    return await this.subscriptionsService.getUsage(user.id);
  }

  @Post('cancel')
  @ApiResponse({ status: 200, description: 'Suscripción cancelada exitosamente' })
  async cancelSubscription(@GetUser() user: User) {
    await this.subscriptionsService.cancelSubscription(user.id);
    return { message: 'Suscripción cancelada exitosamente' };
  }
}
