import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators';
import { User } from '../auth/entities/user.entity';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(AuthGuard())
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @ApiResponse({ status: 201, description: 'Preferencia de pago creada exitosamente' })
  async createPaymentPreference(@GetUser() user: User) {
    return await this.paymentsService.createPaymentPreference(user.id);
  }

  @Get('history')
  @ApiResponse({ status: 200, description: 'Historial de pagos del usuario' })
  async getPaymentHistory(@GetUser() user: User) {
    return await this.paymentsService.getUserPayments(user.id);
  }
}
