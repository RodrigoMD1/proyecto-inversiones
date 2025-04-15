import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { Auth } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) { }

  @Post()
  @Auth(ValidRoles.usuario)
  async create(@Body() createPortfolioDto: CreatePortfolioDto) {
    return await this.portfolioService.create(createPortfolioDto);
  }

  @Get()
  @Auth(ValidRoles.usuario)
  async findAll() {
    return await this.portfolioService.findAll();
  }

  @Get(':id')
  @Auth(ValidRoles.usuario)
  async findOne(@Param('id') id: string) {
    const portfolio = await this.portfolioService.findOne(+id);
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }
    return portfolio;
  }
  
  @Patch(':id')
  @Auth(ValidRoles.usuario)
  async update(@Param('id') id: string, @Body() updatePortfolioDto: UpdatePortfolioDto) {
    const portfolio = await this.portfolioService.update(+id, updatePortfolioDto);
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

  @Delete(':id')
  @Auth(ValidRoles.usuario)
  async remove(@Param('id') id: string) {
    const result = await this.portfolioService.remove(+id);
    if (result.affected === 0) {
      throw new NotFoundException('Portfolio not found');
    }
    return { message: 'Portfolio successfully removed' };
  }
}