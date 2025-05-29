import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioItem } from './entities/portfolio.entity';
import { User } from '../auth/entities/user.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import fetch from 'node-fetch';

const FINNHUB_API_KEY = 'd0s0inhr01qumepgus20d0s0inhr01qumepgus2g'; // Reemplaza por tu API key de Finnhub

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(PortfolioItem)
    private portfolioRepository: Repository<PortfolioItem>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  // Crear un nuevo portfolio
  async create(data: CreatePortfolioDto): Promise<PortfolioItem> {
    const user = await this.userRepository.findOne({
      where: { id: String(data.user_id) },
    });

    if (!user) {
      throw new NotFoundException('El usuario no existe');
    }

    const portfolio = this.portfolioRepository.create({
      name: data.name,
      description: data.description,
      type: data.type,
      quantity: data.quantity,
      purchase_price: data.purchase_price,
      purchase_date: new Date(data.purchase_date),
      ticker: data.ticker,
      user: user,
    });

    return this.portfolioRepository.save(portfolio);
  }

  // Obtener todos los portfolios con el usuario relacionado
  async findAll(): Promise<PortfolioItem[]> {
    return this.portfolioRepository.find({
      relations: ['user'],
    });
  }

  // Obtener un portfolio por su ID
  findOne(id: number) {
    return this.portfolioRepository.findOne({ where: { id } });
  }

  // Obtener todos los portfolios de un usuario específico
  async findByUser(userId: string) {
    return this.portfolioRepository.find({
      where: { user: { id: userId } },
    });
  }

  // Actualizar un portfolio
  async update(id: number, updatePortfolioDto: UpdatePortfolioDto) {
    await this.portfolioRepository.update(id, updatePortfolioDto);
    return this.portfolioRepository.findOne({ where: { id } });
  }

  // Eliminar un portfolio por su ID
  remove(id: number) {
    return this.portfolioRepository.delete(id);
  }

  // Obtener estadísticas del portfolio
  async getStatistics(userId: string) {
    const items = await this.portfolioRepository.find({
      where: { user: { id: userId } },
    });

    if (items.length === 0) {
      return {
        totalValue: 0,
        averagePrice: 0,
        distribution: {},
      };
    }

    let totalValue = 0;
    let totalQuantity = 0;
    const distributionByType: { [type: string]: number } = {};

    for (const item of items) {
      const price = Number(item.purchase_price);
      const quantity = Number(item.quantity);
      const value = price * quantity;
      totalValue += value;
      totalQuantity += quantity;

      if (distributionByType[item.type]) {
        distributionByType[item.type] += value;
      } else {
        distributionByType[item.type] = value;
      }
    }

    const weightedAveragePrice = totalQuantity
      ? totalValue / totalQuantity
      : 0;

    const percentageByType: { [type: string]: number } = {};
    for (const type in distributionByType) {
      percentageByType[type] = (distributionByType[type] / totalValue) * 100;
    }

    return {
      totalValue,
      weightedAveragePrice,
      distribution: percentageByType,
    };
  }

  // Obtener activos ordenados por su valor total
  async getRankedAssets(userId: string) {
    const items = await this.portfolioRepository.find({
      where: { user: { id: userId } },
    });

    const itemsWithValue = items.map(item => ({
      ...item,
      totalValue: Number(item.purchase_price) * item.quantity,
    }));

    itemsWithValue.sort((a, b) => b.totalValue - a.totalValue);
    return itemsWithValue;
  }

  // Resumen por tipo de activo
  async getSummaryByType(userId: string) {
    const items = await this.portfolioRepository.find({
      where: { user: { id: userId } },
    });

    const summary: { [type: string]: { totalValue: number, count: number, averagePrice: number } } = {};

    items.forEach(item => {
      const price = Number(item.purchase_price);
      const quantity = Number(item.quantity);
      const value = price * quantity;

      if (!summary[item.type]) {
        summary[item.type] = { totalValue: 0, count: 0, averagePrice: 0 };
      }
      summary[item.type].totalValue += value;
      summary[item.type].count += 1;
    });
    for (const type in summary) {
      let totalPriceQuantity = 0;
      let totalQuantity = 0;
      items.filter(i => i.type === type).forEach(i => {
        const price = Number(i.purchase_price);
        const quantity = Number(i.quantity);
        totalPriceQuantity += price * quantity;
        totalQuantity += quantity;
      });
      summary[type].averagePrice = totalQuantity > 0
        ? totalPriceQuantity / totalQuantity
        : 0;
    }

    return summary;
  }

  // Obtener el activo con mayor valor
  async getTopAsset(userId: string) {
    const items = await this.portfolioRepository.find({
      where: { user: { id: userId } },
    });

    if (items.length === 0) return null;

    let topAsset = items[0];
    let topValue = Number(topAsset.purchase_price) * topAsset.quantity;

    items.forEach(item => {
      const currentValue = Number(item.purchase_price) * item.quantity;
      if (currentValue > topValue) {
        topValue = currentValue;
        topAsset = item;
      }
    });

    return {
      ...topAsset,
      totalValue: topValue,
    };
  }

  // NUEVO: Obtener rendimiento histórico por fecha (cripto y acciones)
  async getPerformanceByDate(userId: string, date: string) {
    const items = await this.portfolioRepository.find({
      where: { user: { id: userId } },
    });

    if (items.length === 0) return [];

    // Formato requerido por CoinGecko: DD-MM-YYYY
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}-${month}-${year}`;

    const results = await Promise.all(items.map(async item => {
      // Criptomonedas
      if (item.type === 'Criptomoneda') {
        try {
          const res = await fetch(`https://api.coingecko.com/api/v3/coins/${item.ticker}/history?date=${formattedDate}`);
          const data = await res.json();
          const priceOnDate = data?.market_data?.current_price?.usd;
          if (!priceOnDate) return { ...item, rendimiento: null, priceOnDate: null, tipo: 'Criptomoneda' };

          const rendimiento = ((priceOnDate - Number(item.purchase_price)) / Number(item.purchase_price)) * 100;
          return {
            ...item,
            priceOnDate,
            rendimiento,
            tipo: 'Criptomoneda'
          };
        } catch {
          return { ...item, rendimiento: null, priceOnDate: null, tipo: 'Criptomoneda' };
        }
      }
      // Acciones (usando Finnhub)
      if (item.type === 'Acción') {
        try {
          // Finnhub requiere fechas en formato UNIX timestamp
          const from = Math.floor(new Date(item.purchase_date).getTime() / 1000);
          const to = Math.floor(new Date(`${year}-${month}-${day}`).getTime() / 1000);
          const res = await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${item.ticker}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`);
          const data = await res.json();
          const closePrices = data.c;
          const priceOnDate = closePrices && closePrices.length > 0 ? closePrices[closePrices.length - 1] : null;
          if (!priceOnDate) return { ...item, rendimiento: null, priceOnDate: null, tipo: 'Acción' };

          const rendimiento = ((priceOnDate - Number(item.purchase_price)) / Number(item.purchase_price)) * 100;
          return {
            ...item,
            priceOnDate,
            rendimiento,
            tipo: 'Acción'
          };
        } catch {
          return { ...item, rendimiento: null, priceOnDate: null, tipo: 'Acción' };
        }
      }
      // Otros tipos
      return { ...item, rendimiento: null, priceOnDate: null, tipo: item.type };
    }));

    return results;
  }
}