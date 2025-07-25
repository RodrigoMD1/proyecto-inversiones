/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { PaymentsService } from '../payments/payments.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaymentStatus } from '../payments/entities/payment.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post('mercadopago')
  async handleMercadoPagoWebhook(
    @Body() body: any,
    @Headers('x-signature') signature: string
  ) {
    try {
      console.log('Webhook recibido:', body);
      
      // Verificar que sea una notificación de pago
      if (body.type === 'payment') {
        const paymentId = body.data.id;
        
        // Aquí deberías verificar la firma del webhook para seguridad
        // const isValidSignature = this.verifyWebhookSignature(body, signature);
        // if (!isValidSignature) {
        //   throw new BadRequestException('Firma inválida');
        // }

        // Obtener información del pago desde MercadoPago
        // En un caso real, harías una llamada a la API de MP para obtener los detalles
        const paymentData = body.data;
        
        // Actualizar el pago en nuestra base de datos
        const payment = await this.paymentsService.updatePaymentStatus(
          paymentData.external_reference,
          this.mapMercadoPagoStatusToPaymentStatus(paymentData.status),
          paymentId
        );

        // Si el pago fue aprobado, activar suscripción premium
        if (paymentData.status === 'approved' && payment) {
          await this.subscriptionsService.activatePremium(
            payment.user.id,
            paymentId
          );
        }

        return { received: true };
      }

      return { received: true };
    } catch (error) {
      console.error('Error procesando webhook:', error);
      throw new BadRequestException('Error procesando webhook');
    }
  }

  private mapMercadoPagoStatusToPaymentStatus(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case 'approved':
        return PaymentStatus.APPROVED;
      case 'rejected':
        return PaymentStatus.REJECTED;
      case 'cancelled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  // Método para verificar firma del webhook (implementar según documentación de MP)
  private verifyWebhookSignature(body: any, signature: string): boolean {
    // Implementar verificación de firma según documentación de MercadoPago
    return true; // Placeholder
  }
}
