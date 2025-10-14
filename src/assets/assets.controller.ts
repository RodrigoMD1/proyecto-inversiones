import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetsService.create(createAssetDto);
  }

  @Get()
  findAll() {
    return this.assetsService.findAll();
  }

  @Get('search/:query')
  searchAssets(@Param('query') query: string) {
    return this.assetsService.searchInFinnhub(query);
  }

  @Post('get-or-create')
  getOrCreateAsset(@Body() data: { symbol: string }) {
    return this.assetsService.getOrCreateAsset(data.symbol);
  }

  @Get('current-price/:symbol')
  getCurrentPrice(@Param('symbol') symbol: string) {
    return this.assetsService.getCurrentPrice(symbol);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.assetsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetsService.update(id, updateAssetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.assetsService.remove(id);
  }
}