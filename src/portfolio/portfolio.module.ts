import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioItem } from './entities/portfolio.entity';
import { User } from 'src/auth/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { ReportService } from './report.service';
import { ReportController } from './report.controller'; // <-- importa el nuevo controlador

@Module({
  imports: [
    TypeOrmModule.forFeature([PortfolioItem, User]),
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' })
  ],
  controllers: [PortfolioController, ReportController], // <-- agrega aquí el controlador de reportes
  providers: [PortfolioService, ReportService],
})
export class PortfolioModule {}