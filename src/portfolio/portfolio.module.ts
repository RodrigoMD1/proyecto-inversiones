import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importar TypeOrmModule
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioItem } from './entities/portfolio.entity'; // Importar la entidad

@Module({
  imports: [TypeOrmModule.forFeature([PortfolioItem])], // Registrar la entidad
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}