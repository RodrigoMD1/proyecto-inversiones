import { Controller, Post, Get, UseGuards, Body } from '@nestjs/common';
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

  @Post('preapproval')
  @ApiResponse({ status: 201, description: 'Suscripción (preapproval) creada exitosamente' })
  async createPreapproval(@GetUser() user: User, @Body() body: { plan?: string }) {
    const plan = body?.plan ?? 'PREMIUM';
    return await this.paymentsService.createPreapproval(user.id, plan);
  }

  @Post('preapproval/cancel')
  @ApiResponse({ status: 200, description: 'Suscripción (preapproval) cancelada exitosamente' })
  async cancelPreapproval(@GetUser() user: User) {
    return await this.paymentsService.cancelUserPreapproval(user.id);
  }

  @Post('preapproval-plan')
  @ApiResponse({ status: 201, description: 'Plan de suscripción creado en Mercado Pago' })
  async createPreapprovalPlan(
    @GetUser() _user: User,
    @Body()
    body: {
      reason: string;
      frequency: number;
      frequency_type: 'days' | 'months';
      transaction_amount: number;
      currency_id: string;
      repetitions?: number;
      billing_day?: number;
      billing_day_proportional?: boolean;
      free_trial?: { frequency: number; frequency_type: 'days' | 'months' };
      back_url?: string;
    },
  ) {
    return await this.paymentsService.createPreapprovalPlan(body);
  }

  @Post('preapproval/authorize')
  @ApiResponse({ status: 201, description: 'Suscripción autorizada con plan asociado y tarjeta' })
  async authorizePreapproval(
    @GetUser() user: User,
    @Body()
    body: {
      preapproval_plan_id: string;
      card_token_id: string;
      reason?: string;
      back_url?: string;
      start_date?: string;
      end_date?: string;
    },
  ) {
    return await this.paymentsService.createPreapprovalAuthorized(user.id, body);
  }

  @Get('preapproval-plan/id')
  @ApiResponse({ status: 200, description: 'Devuelve el preapproval_plan_id por defecto, creándolo si no existe' })
  async getDefaultPlanId() {
    const res = await this.paymentsService.getOrCreateDefaultPreapprovalPlan();
    if (!res) return { id: null };
    return res;
  }

  // endpoint público para que el front obtenga el id del plan (sin JWT)
  @Get('preapproval-plan/public')
  @UseGuards()
  @ApiResponse({ status: 200, description: 'Devuelve el preapproval_plan_id para uso público del front' })
  async getPublicPlanId() {
    const res = await this.paymentsService.getOrCreateDefaultPreapprovalPlan();
    return { id: res?.id || null };
  }

  // endpoint para forzar/override del plan id (requiere JWT)
  @Post('preapproval-plan/override')
  @ApiResponse({ status: 200, description: 'Fija el MP_PREAPPROVAL_PLAN_ID en runtime' })
  async overridePlanId(@Body() body: { id: string }) {
    return this.paymentsService.setPreapprovalPlanId(body?.id);
  }

  @Get('history')
  @ApiResponse({ status: 200, description: 'Historial de pagos del usuario' })
  async getPaymentHistory(@GetUser() user: User) {
    return await this.paymentsService.getUserPayments(user.id);
  }
}
