import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioItem } from './entities/portfolio.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(PortfolioItem)
    private portfolioRepository: Repository<PortfolioItem>,
  ) { }

  create(createPortfolioDto: CreatePortfolioDto) {
    const portfolio = this.portfolioRepository.create(createPortfolioDto);
    return this.portfolioRepository.save(portfolio);
  }

  findAll() {
    return this.portfolioRepository.find();
  }

  findOne(id: number) {
    return this.portfolioRepository.findOne({ where: { id } });
  }

  async update(id: number, updatePortfolioDto: UpdatePortfolioDto) {
    await this.portfolioRepository.update(id, updatePortfolioDto);
    return this.portfolioRepository.findOne({ where: { id } });
  }

  remove(id: number) {
    return this.portfolioRepository.delete(id);
  }
}