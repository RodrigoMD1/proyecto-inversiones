import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // Importamos InjectRepository
import { Repository } from 'typeorm'; // Importamos Repository
import { Asset } from './entities/asset.entity'; // Importamos la entidad Asset
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import fetch from 'node-fetch';

const FINNHUB_API_KEY = 'd0s0inhr01qumepgus20d0s0inhr01qumepgus2g';

@Injectable()
export class AssetsService {
  private priceCache = new Map<string, { price: number; timestamp: number; data: any }>();
  private CACHE_DURATION = 60 * 1000; // 1 minuto

  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>, // Inyectamos el repositorio de Asset
  ) {}

  // Crear un nuevo activo
  async create(createAssetDto: CreateAssetDto) {
    let finalSymbol = createAssetDto.symbol;
    let finalName = createAssetDto.name;
    let finalDescription = createAssetDto.description;
    
    // Si el símbolo parece genérico (TEST, ASSET, etc.) o el nombre parece ser de una empresa real,
    // intentar buscar el símbolo correcto en Finnhub
    if (createAssetDto.symbol.includes('TEST') || 
        createAssetDto.symbol.includes('ASSET') ||
        createAssetDto.name.toLowerCase().includes('apple') ||
        createAssetDto.name.toLowerCase().includes('tesla') ||
        createAssetDto.name.toLowerCase().includes('microsoft') ||
        createAssetDto.name.toLowerCase().includes('google') ||
        createAssetDto.name.toLowerCase().includes('amazon')) {
      
      try {
        // Mapeo de nombres comunes a símbolos
        const commonStocks: Record<string, string> = {
          'apple': 'AAPL',
          'tesla': 'TSLA',
          'microsoft': 'MSFT',
          'google': 'GOOGL',
          'alphabet': 'GOOGL',
          'amazon': 'AMZN',
          'meta': 'META',
          'facebook': 'META',
          'netflix': 'NFLX',
          'nvidia': 'NVDA',
        };
        
        const nameLower = createAssetDto.name.toLowerCase();
        let symbolToCheck = createAssetDto.symbol;
        
        // Buscar si el nombre coincide con algún stock conocido
        for (const [key, value] of Object.entries(commonStocks)) {
          if (nameLower.includes(key)) {
            symbolToCheck = value;
            break;
          }
        }
        
        // Obtener información del símbolo en Finnhub
        const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbolToCheck}&token=${FINNHUB_API_KEY}`);
        const profileData = await profileRes.json();
        
        if (profileData && profileData.name && !profileData.error) {
          finalSymbol = symbolToCheck;
          finalName = profileData.name;
          finalDescription = `${profileData.finnhubIndustry || 'Company'} - ${profileData.exchange || ''}`;
        }
        
      } catch (error) {
        // Silenciar error, usar datos originales
      }
    }
    
    const asset = this.assetRepository.create({
      symbol: finalSymbol,
      name: finalName,
      type: createAssetDto.type,
      description: finalDescription || createAssetDto.description
    });
    
    return await this.assetRepository.save(asset);
  }

  // Obtener todos los activos
  async findAll() {
    return await this.assetRepository.find(); // Devuelve todos los activos
  }

  // Buscar assets en Finnhub
  async searchInFinnhub(query: string) {
    try {
      // Buscar en Finnhub
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
      );
      const data = await response.json();
      
      if (!data.result || data.result.length === 0) {
        return { results: [] };
      }
      
      // Obtener detalles de los primeros 5 resultados
      const detailedResults = await Promise.all(
        data.result.slice(0, 5).map(async (item: any) => {
          try {
            const profileRes = await fetch(
              `https://finnhub.io/api/v1/stock/profile2?symbol=${item.symbol}&token=${FINNHUB_API_KEY}`
            );
            const profile = await profileRes.json();
            
            return {
              symbol: item.symbol,
              name: profile.name || item.description,
              description: `${profile.finnhubIndustry || 'Company'} - ${profile.exchange || item.type}`,
              type: 'stock',
              logo: profile.logo || null,
              country: profile.country || null,
              exchange: profile.exchange || null,
              industry: profile.finnhubIndustry || null,
              marketCap: profile.marketCapitalization || null,
            };
          } catch (error) {
            return {
              symbol: item.symbol,
              name: item.description,
              description: item.type,
              type: 'stock',
            };
          }
        })
      );
      
      return { results: detailedResults };
    } catch (error) {
      console.error('[ASSETS] Error en búsqueda:', error);
      return { results: [], error: error.message };
    }
  }

  // Obtener o crear asset (evita duplicados)
  async getOrCreateAsset(symbol: string) {
    // Buscar si ya existe
    const existing = await this.assetRepository.findOne({ 
      where: { symbol } 
    });
    
    if (existing) {
      return existing;
    }
    
    // No existe, obtener datos de Finnhub y crear
    try {
      const profileRes = await fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      const profile = await profileRes.json();
      
      if (profile && profile.name && !profile.error) {
        const newAsset = await this.create({
          symbol: symbol,
          name: profile.name,
          type: 'stock',
          description: `${profile.finnhubIndustry || 'Company'} - ${profile.exchange || ''}`
        });
        
        return newAsset;
      }
      
      throw new Error('No se encontró información para este símbolo');
    } catch (error) {
      console.error(`[ASSETS] Error creando asset:`, error);
      throw new Error(`Error creando asset: ${error.message}`);
    }
  }

  // Obtener un activo por ID
  async findOne(id: number) {
    return await this.assetRepository.findOne({ where: { id } }); // Devuelve un activo según el ID
  }

  // Actualizar un activo por ID
  async update(id: number, updateAssetDto: UpdateAssetDto) {
    await this.assetRepository.update(id, updateAssetDto); // Actualizamos el activo en la base de datos
    return this.findOne(id); // Devuelve el activo actualizado
  }

  // Eliminar un activo por ID
  async remove(id: number) {
    await this.assetRepository.delete(id); // Eliminamos el activo de la base de datos
    return { deleted: true }; // Retorna un objeto confirmando la eliminación
  }

  // Obtener precio actual de un activo con cache
  async getCurrentPrice(symbol: string) {
    // Verificar cache
    const cached = this.priceCache.get(symbol);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return {
        symbol: symbol,
        price: cached.price,
        currency: 'USD',
        timestamp: new Date(cached.timestamp).toISOString(),
        cached: true,
        ...cached.data
      };
    }
    
    // Obtener de Finnhub
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      
      const data = await response.json();
      
      // data.c = current price (precio actual)
      if (data.c && data.c > 0) {
        // Guardar en cache
        this.priceCache.set(symbol, {
          price: data.c,
          timestamp: now,
          data: {
            high: data.h,          // Precio máximo del día
            low: data.l,           // Precio mínimo del día
            open: data.o,          // Precio de apertura
            previousClose: data.pc, // Precio de cierre anterior
            change: data.d,        // Cambio del día
            changePercent: data.dp // % de cambio
          }
        });
        
        return {
          symbol: symbol,
          price: data.c,
          currency: 'USD',
          timestamp: new Date().toISOString(),
          cached: false,
          high: data.h,
          low: data.l,
          open: data.o,
          previousClose: data.pc,
          change: data.d,
          changePercent: data.dp
        };
      } else {
        throw new Error('Precio no disponible para este símbolo');
      }
    } catch (error) {
      throw new Error(`Precio no disponible para este símbolo: ${error.message}`);
    }
  }
}
