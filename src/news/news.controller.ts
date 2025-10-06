import { Controller, Get, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import { ApiTags, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('news')
@ApiTags('News')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiQuery({ name: 'country', required: false, enum: ['AR', 'US'] })
  @ApiResponse({ status: 200, description: 'Noticias financieras obtenidas exitosamente' })
  async getNews(@Query('country') country?: 'AR' | 'US') {
    return this.newsService.getNews(country);
  }

  @Get('argentina')
  @ApiResponse({ status: 200, description: 'Noticias de Argentina obtenidas exitosamente' })
  async getArgentinaNews() {
    return this.newsService.getArgentinaNews();
  }

  @Get('usa')
  @ApiResponse({ status: 200, description: 'Noticias de USA obtenidas exitosamente' })
  async getUSANews() {
    return this.newsService.getUSANews();
  }
}