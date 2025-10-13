import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { User } from 'src/auth/entities/user.entity';
import { AssetLimitGuard } from '../guards/asset-limit.guard';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) { }

  @Post()
  @UseGuards(AssetLimitGuard)
  @Auth(ValidRoles.usuario)
  async create(@Body() createPortfolioDto: CreatePortfolioDto, @GetUser() user: User) {
    return await this.portfolioService.create(createPortfolioDto, user);
  }

  @Get()
  @Auth(ValidRoles.usuario)
  async findAll() {
    return await this.portfolioService.findAll();
  }

  @Get(':id')
  @Auth(ValidRoles.usuario)
  async findOne(@Param('id') id: string) {
    const portfolio = await this.portfolioService.findOne(Number(id));
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }
    return portfolio;
  }

  @Patch(':id')
  @Auth(ValidRoles.usuario)
  async update(@Param('id') id: string, @Body() updatePortfolioDto: UpdatePortfolioDto) {
    const portfolio = await this.portfolioService.update(Number(id), updatePortfolioDto);
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }
    return portfolio;
  }

  @Get('/user/:userId')
  @Auth(ValidRoles.usuario)
  findByUser(@Param('userId') userId: string) {
    return this.portfolioService.findByUser(userId);
  }

  @Get('statistics/:userId')
  @Auth(ValidRoles.usuario)
  async getStatistics(@Param('userId') userId: string) {
    const totalStats = await this.portfolioService.getStatistics(userId);
    const rankedAssets = await this.portfolioService.getRankedAssets(userId);
    const summaryByType = await this.portfolioService.getSummaryByType(userId);
    const topAsset = await this.portfolioService.getTopAsset(userId);

    return {
      totalStats,
      rankedAssets,
      summaryByType,
      topAsset,
    };
  }

  // NUEVO: Endpoint para rendimiento histórico
  @Get('performance/:userId')
  @Auth(ValidRoles.usuario)
  async getPerformanceByDate(
    @Param('userId') userId: string,
    @Query('date') date: string
  ) {
    if (!date) {
      throw new BadRequestException('Parámetro "date" es requerido. Formato: YYYY-MM-DD');
    }
    return await this.portfolioService.getPerformanceByDate(userId, date);
  }

  @Delete('item/:id')
  @Auth(ValidRoles.usuario)
  async remove(@Param('id') id: string) {
    const result = await this.portfolioService.remove(Number(id));
    if (result.affected === 0) {
      throw new NotFoundException('Portfolio not found');
    }
    return { message: 'Portfolio successfully removed' };
  }

  @Get('history/:id')
  async getPortfolioHistory(@Param('id') id: string, @Query('from') from: string, @Query('to') to: string) {
    if (!id || id === "undefined") {
      throw new BadRequestException('ID de usuario inválido');
    }
    return this.portfolioService.getPortfolioHistory(id, from, to);
  }

  @Get('current-performance/:userId')
  async getCurrentPerformance(@Param('userId') userId: string) {
    return this.portfolioService.getCurrentPerformance(userId);
  }
}