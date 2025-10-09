import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioItem } from './entities/portfolio.entity';
import { User } from 'src/auth/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { ReportService } from './report.service';
import { ReportController } from './report.controller'; // <-- importa el nuevo controlador
import { AssetLimitGuard } from '../guards/asset-limit.guard';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { EmailModule } from '../email/email.module';
import { ReportAnalysisService } from './report-analysis.service';
import { PdfGeneratorService } from './pdf-generator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PortfolioItem, User]),
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    EmailModule,
    forwardRef(() => SubscriptionsModule)
  ],
  controllers: [PortfolioController, ReportController],
  providers: [
    PortfolioService, 
    ReportService, 
    ReportAnalysisService,
    PdfGeneratorService,
    AssetLimitGuard
  ],
  exports: [ReportService], // <-- agrega esta línea
})
export class PortfolioModule {}