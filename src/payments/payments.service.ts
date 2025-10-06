import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { User } from '../auth/entities/user.entity';
import { MercadoPagoConfig, Preference, PreApproval } from 'mercadopago';
import axios from 'axios';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class PaymentsService {
  private client: MercadoPagoConfig;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
  }

  // Crear preferencia de pago
  async createPaymentPreference(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const preference = new Preference(this.client);

    const preferenceData = {
      items: [
        {
          id: 'premium-plan',
          title: 'Plan Premium - Acceso Ilimitado',
          description: 'Suscripción mensual al plan premium con acceso ilimitado',
          quantity: 1,
          unit_price: 9.99,
          currency_id: 'USD'
        }
      ],
      payer: {
        name: user.name,
        email: user.email
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/payment/success`,
        failure: `${process.env.FRONTEND_URL}/payment/failure`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`
      },
      auto_return: 'approved',
      notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
      external_reference: userId,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
    };

    try {
      const response = await preference.create({ body: preferenceData });
      
      // Guardar registro de pago
      const payment = this.paymentRepository.create({
        user,
        amount: 9.99,
        status: PaymentStatus.PENDING,
        preference_id: response.id,
        mercadopago_payment_id: response.id
      });

      await this.paymentRepository.save(payment);

      return {
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point
      };
    } catch (error) {
      console.error('Error creando preferencia de pago:', error);
      throw new BadRequestException('Error al crear la preferencia de pago');
    }
  }

  // Crear plan asociado (preapproval_plan)
  async createPreapprovalPlan(body: {
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
  }) {
    const url = 'https://api.mercadopago.com/preapproval_plan';
    const payload: any = {
      reason: body.reason,
      auto_recurring: {
        frequency: body.frequency,
        frequency_type: body.frequency_type,
        transaction_amount: body.transaction_amount,
        currency_id: body.currency_id,
        ...(body.repetitions ? { repetitions: body.repetitions } : {}),
        ...(body.billing_day ? { billing_day: body.billing_day } : {}),
        ...(typeof body.billing_day_proportional === 'boolean'
          ? { billing_day_proportional: body.billing_day_proportional }
          : {}),
        ...(body.free_trial ? { free_trial: body.free_trial } : {}),
      },
      payment_methods_allowed: { payment_types: [{}], payment_methods: [{}] },
      back_url: body.back_url || process.env.FRONTEND_URL,
    };

    try {
      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      return res.data; // contiene id (preapproval_plan_id)
    } catch (error: any) {
      console.error('Error creando preapproval_plan:', error?.response?.data || error);
      throw new BadRequestException('No se pudo crear el plan de suscripción');
    }
  }

  // Obtener o crear plan por defecto y devolver su id
  async getOrCreateDefaultPreapprovalPlan(): Promise<{ id: string; created: boolean; data?: any } | null> {
    const envPlanId = process.env.MP_PREAPPROVAL_PLAN_ID;
    if (envPlanId) return { id: envPlanId, created: false };

    const reason = process.env.MP_PLAN_REASON || 'Plan Premium Mensual';
    const frequency = 1;
    const frequency_type: 'days' | 'months' = (process.env.MP_PLAN_FREQUENCY_TYPE as any) || 'months';
    const transaction_amount = Number(process.env.MP_PREMIUM_PRICE || 5000);
    const currency_id = process.env.MP_CURRENCY || 'ARS';
    const back_url = process.env.FRONTEND_URL || 'http://localhost:5173';

    try {
      const created = await this.createPreapprovalPlan({
        reason,
        frequency,
        frequency_type,
        transaction_amount,
        currency_id,
        back_url,
      });
      if (created?.id) {
        return { id: created.id, created: true, data: created };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Establecer/forzar el preapproval_plan_id en runtime (útil para prod)
  setPreapprovalPlanId(id: string) {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('plan id inválido');
    }
    (process.env as any).MP_PREAPPROVAL_PLAN_ID = id;
    return { id };
  }

  // Crear suscripción authorized con plan asociado y card_token_id
  async createPreapprovalAuthorized(
    userId: string,
    body: {
      preapproval_plan_id: string;
      card_token_id: string;
      reason?: string;
      back_url?: string;
      start_date?: string;
      end_date?: string;
    },
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const preapproval = new PreApproval(this.client);
    const payload: any = {
      preapproval_plan_id: body.preapproval_plan_id,
      reason: body.reason || 'Suscripción con plan asociado',
      external_reference: userId,
      payer_email: user.email,
      card_token_id: body.card_token_id,
      auto_recurring: {
        start_date: body.start_date,
        end_date: body.end_date,
      },
      back_url: body.back_url || process.env.FRONTEND_URL,
      status: 'authorized',
    };

    try {
      const res = await preapproval.create({ body: payload });

      // actualizar suscripción local: PREMIUM activa
      await this.subscriptionRepository.update(
        { user: { id: userId }, status: SubscriptionStatus.ACTIVE },
        { status: SubscriptionStatus.CANCELLED },
      );

      const subscription = this.subscriptionRepository.create({
        user,
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.ACTIVE,
        asset_limit: 999999,
        mercadopago_subscription_id: res.id,
      });
      await this.subscriptionRepository.save(subscription);

      return res;
    } catch (error) {
      console.error('Error creando preapproval authorized:', (error as any)?.response?.data || error);
      throw new BadRequestException('No se pudo autorizar la suscripción');
    }
  }

  // Crear preapproval (suscripción recurrente)
  async createPreapproval(userId: string, plan: string = 'PREMIUM') {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const amount = Number(process.env.MP_PREMIUM_PRICE || 9.99);

    const preapproval = new PreApproval(this.client);
    const body = {
      reason: `Suscripción ${plan} - Proyecto Inversiones`,
      external_reference: userId,
      back_url: `${process.env.FRONTEND_URL}/payment/success`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: amount,
        currency_id: process.env.MP_CURRENCY || 'ARS',
      },
      payer_email: user.email,
      status: 'pending',
    } as any;

    try {
      const res = await preapproval.create({ body });

      // Guardar/actualizar suscripción local como PENDING hasta webhook
      let subscription = await this.subscriptionRepository.findOne({
        where: { user: { id: userId }, status: SubscriptionStatus.ACTIVE },
      });
      if (subscription) {
        subscription.status = SubscriptionStatus.CANCELLED;
        await this.subscriptionRepository.save(subscription);
      }

      subscription = this.subscriptionRepository.create({
        user,
        plan: SubscriptionPlan.PREMIUM,
        status: SubscriptionStatus.PENDING,
        asset_limit: 999999,
        mercadopago_subscription_id: res.id,
      });
      await this.subscriptionRepository.save(subscription);

      return {
        preapprovalId: res.id,
  initPoint: (res as any)?.init_point || (res as any)?.sandbox_init_point || null,
  sandboxInitPoint: (res as any)?.sandbox_init_point || null,
        status: res.status,
      };
    } catch (error) {
      console.error('Error creando preapproval:', error);
      throw new BadRequestException('No se pudo crear la suscripción');
    }
  }

  // Cancelar preapproval del usuario si existe
  async cancelUserPreapproval(userId: string) {
    const sub = await this.subscriptionRepository.findOne({
      where: { user: { id: userId }, status: SubscriptionStatus.ACTIVE },
    });

    if (!sub || !sub.mercadopago_subscription_id) {
      return { message: 'No hay suscripción activa para cancelar' };
    }

    const preapproval = new PreApproval(this.client);
    try {
      await preapproval.update({ id: sub.mercadopago_subscription_id, body: { status: 'cancelled' } as any });
    } catch (e) {
      console.warn('No se pudo cancelar preapproval en MP, continuando:', e?.message || e);
    }

    sub.status = SubscriptionStatus.CANCELLED;
    await this.subscriptionRepository.save(sub);

    return { message: 'Suscripción cancelada' };
  }

  // Actualizar estado del pago
  async updatePaymentStatus(paymentId: string, status: PaymentStatus, mercadopagoPaymentId?: string) {
    const payment = await this.paymentRepository.findOne({
      where: { preference_id: paymentId },
      relations: ['user']
    });

    if (!payment) {
      throw new BadRequestException('Pago no encontrado');
    }

    payment.status = status;
    if (mercadopagoPaymentId) {
      payment.mercadopago_payment_id = mercadopagoPaymentId;
    }

    return await this.paymentRepository.save(payment);
  }

  // Obtener historial de pagos del usuario
  async getUserPayments(userId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' }
    });
  }

  // Verificar pago por ID
  async getPaymentById(paymentId: string): Promise<Payment> {
    return await this.paymentRepository.findOne({
      where: { preference_id: paymentId },
      relations: ['user']
    });
  }
}
