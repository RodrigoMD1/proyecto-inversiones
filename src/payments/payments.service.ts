import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { User } from '../auth/entities/user.entity';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class PaymentsService {
  private client: MercadoPagoConfig;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
