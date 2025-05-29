// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { ReportService } from '../portfolio/report.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { TypeOrmModule as PortfolioTypeOrmModule } from '@nestjs/typeorm';
import { PortfolioItem } from '../portfolio/entities/portfolio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PortfolioTypeOrmModule.forFeature([PortfolioItem, User]), // Para que ReportService funcione
  ],
  controllers: [UsersController],
  providers: [UsersService, ReportService, PortfolioService],
  exports: [UsersService],
})
export class UsersModule { }