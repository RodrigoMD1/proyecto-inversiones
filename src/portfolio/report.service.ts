import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as cron from 'node-cron';
import { PortfolioService } from './portfolio.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReportService {
  constructor(
    private readonly portfolioService: PortfolioService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
        emailVerified: true, // Solo usuarios con email verificado
      },
    });

    for (const user of users) {
      const stats = await this.portfolioService.getStatistics(user.id);
      const reportContent = `
        <h2>Reporte Diario de tu Portfolio</h2>
        <p>Hola ${user.name || user.email}, este es tu resumen:</p>
        <p>Valor total: $${stats.totalValue}</p>
        <p>Precio promedio ponderado: $${stats.weightedAveragePrice}</p>
        <p>Distribución: ${JSON.stringify(stats.distribution)}</p>
      `;
      try {
        await this.sendEmail(user.email, 'Reporte Diario de tu Portfolio', reportContent);
      } catch (error) {
        console.error(`Error enviando reporte a ${user.email}:`, error.message);
      }
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'rodrigomd123456@gmail.com',
        pass: 'kzqw ggul wtau yypk',
      },
    });

    await transporter.sendMail({
      from: '"Finance App" <rodrigomd123456@gmail.com>',
      to,
      subject,
      html,
    });
  }
}