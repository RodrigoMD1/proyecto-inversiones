import { Injectable } from '@nestjs/common';
import * as cron from 'node-cron';
import { PortfolioService } from './portfolio.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class ReportService {
  constructor(
    private readonly portfolioService: PortfolioService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {
    // Programa el envío diario a las 8 AM
    cron.schedule('0 8 * * *', () => {
      this.sendDailyReports();
    });
  }

  // Enviar reportes diarios solo a usuarios con email verificado y reportes activos
  async sendDailyReports() {
    const users = await this.userRepository.find({
      where: {
        reportEnabled: true,
        reportFrequency: 'daily',
        emailVerified: true,
      },
    });

    for (const user of users) {
      const stats = await this.portfolioService.getStatistics(user.id);
      // Normaliza el objeto stats para asegurar que tiene las propiedades requeridas
      const normalizedStats = {
        totalValue: stats.totalValue,
        weightedAveragePrice: stats.weightedAveragePrice ?? stats.averagePrice ?? 0,
        distribution: stats.distribution && Object.keys(stats.distribution).length > 0 ? stats.distribution : {} as Record<string, number>,
      };
      const reportContent = this.generateStyledReportContent(user, normalizedStats, true);
      try {
        await this.emailService.sendEmail(user.email, 'Reporte Diario de tu Portfolio', reportContent);
      } catch (error) {
        console.error(`Error enviando reporte a ${user.email}:`, error.message);
      }
    }
  }

  // Generar datos para el PDF o HTML del reporte
  async generateReportData(userId: string) {
    const stats = await this.portfolioService.getStatistics(userId);
    return {
      totalValue: stats.totalValue,
      weightedAveragePrice: stats.weightedAveragePrice,
      distribution: stats.distribution,
    };
  }

  // Generar reporte en HTML (para descarga manual)
  async generateReport(userId: string) {
    const stats = await this.portfolioService.getStatistics(userId);
    // Normaliza el objeto stats para asegurar que tiene las propiedades requeridas
    const normalizedStats = {
      totalValue: stats.totalValue,
      weightedAveragePrice: stats.weightedAveragePrice ?? stats.averagePrice ?? 0,
      distribution: stats.distribution && Object.keys(stats.distribution).length > 0 ? stats.distribution : {} as Record<string, number>,
    };
    // Puedes pasar null como usuario si no tienes el nombre
    return this.generateStyledReportContent(null, normalizedStats, false);
  }

  // Nuevo método para generar HTML estilizado
  private generateStyledReportContent(
    user: User | null,
    stats: { totalValue: number; weightedAveragePrice: number; distribution: Record<string, number> },
    isEmail: boolean
  ) {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f8fb; padding: 32px;">
        <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; padding: 32px;">
          <h2 style="color: #2563eb; margin-bottom: 8px;">
            ${isEmail ? 'Reporte Diario de tu Portfolio' : 'Reporte de tu Portfolio'}
          </h2>
          ${
            user
              ? `<p style="color: #222;">Hola <b>${user.name || user.email}</b>, este es tu resumen:</p>`
              : ''
          }
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #2563eb;">Valor total</td>
              <td style="padding: 8px;">$${stats.totalValue}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #2563eb;">Precio promedio ponderado</td>
              <td style="padding: 8px;">$${stats.weightedAveragePrice}</td>
            </tr>
          </table>
          <h4 style="margin-top: 24px; color: #2563eb;">Distribución de activos</h4>
          <ul style="padding-left: 20px; color: #444;">
            ${Object.entries(stats.distribution)
              .map(
                ([tipo, valor]) =>
                  `<li><b>${tipo}:</b> $${valor}</li>`
              )
              .join('')}
          </ul>
          <p style="margin-top: 32px; color: #888; font-size: 13px;">
            Este reporte es generado automáticamente por <b>FinancePR</b>.
          </p>
        </div>
      </div>
    `;
  }
}