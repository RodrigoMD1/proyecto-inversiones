import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) { }

  @Post()
  async create(@Body() createPortfolioDto: CreatePortfolioDto) {
    return await this.portfolioService.create(createPortfolioDto);
  }

  @Get()
  async findAll() {
    return await this.portfolioService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const portfolio = await this.portfolioService.findOne(+id);
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }
    return portfolio;
  }
  
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePortfolioDto: UpdatePortfolioDto) {
    const portfolio = await this.portfolioService.update(+id, updatePortfolioDto);
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }
    return portfolio;
  }

  @Get('/user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.portfolioService.findByUser(+userId);
  }

  @Get('statistics/:userId')
  async getStatistics(@Param('userId') userId: string) {
    const userIdNumber = +userId;
    if (isNaN(userIdNumber)) {
      throw new NotFoundException('El ID de usuario no es válido');
    }
    const totalStats = await this.portfolioService.getStatistics(userIdNumber);
    const rankedAssets = await this.portfolioService.getRankedAssets(userIdNumber);
    const summaryByType = await this.portfolioService.getSummaryByType(userIdNumber);
    const topAsset = await this.portfolioService.getTopAsset(userIdNumber);

    return {
      totalStats,
      rankedAssets,
      summaryByType,
      topAsset,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.portfolioService.remove(+id);
    if (result.affected === 0) {
      throw new NotFoundException('Portfolio not found');
    }
    return { message: 'Portfolio successfully removed' };
  }
}