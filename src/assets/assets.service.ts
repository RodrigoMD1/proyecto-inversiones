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
      // Buscar simultáneamente en acciones (Finnhub) y criptos (CoinGecko)
      const [stockResults, cryptoResults] = await Promise.all([
        this.searchStocks(query),
        this.searchCrypto(query)
      ]);
      
      // Combinar resultados (criptos primero si la query parece crypto)
      const isCryptoQuery = query.toLowerCase().includes('bitcoin') || 
                           query.toLowerCase().includes('crypto') ||
                           query.toLowerCase().includes('btc') ||
                           query.toLowerCase().includes('eth');
      
      const combined = isCryptoQuery 
        ? [...cryptoResults, ...stockResults]
        : [...stockResults, ...cryptoResults];
      
      return { results: combined.slice(0, 10) }; // Top 10 resultados
    } catch (error) {
      console.error('[ASSETS] Error en búsqueda:', error);
      return { results: [], error: error.message };
    }
  }

  // Buscar acciones en Finnhub
  private async searchStocks(query: string) {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
      );
      const data = await response.json();
      
      if (!data.result || data.result.length === 0) {
        return [];
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
      
      return detailedResults;
    } catch (error) {
      return [];
    }
  }

  // Buscar criptomonedas en CoinGecko
  private async searchCrypto(query: string) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      
      if (!data.coins || data.coins.length === 0) {
        return [];
      }
      
      // Mapear resultados de CoinGecko a nuestro formato
      const cryptoResults = data.coins.slice(0, 5).map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        description: `Cryptocurrency - Rank #${coin.market_cap_rank || 'N/A'}`,
        type: 'crypto',
        logo: coin.large || coin.thumb,
        exchange: 'CoinGecko',
        industry: 'Cryptocurrency',
        marketCap: null,
        coinGeckoId: coin.id // Para futuras consultas de precio
      }));
      
      return cryptoResults;
    } catch (error) {
      return [];
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
    
    // Intentar primero como acción (Finnhub)
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
    } catch (error) {
      // Si falla, intentar como cripto
    }
    
    // Intentar como criptomoneda (CoinGecko)
    try {
      const searchRes = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`
      );
      const searchData = await searchRes.json();
      
      if (searchData.coins && searchData.coins.length > 0) {
        const coin = searchData.coins[0];
        
        const newAsset = await this.create({
          symbol: symbol.toUpperCase(),
          name: coin.name,
          type: 'crypto',
          description: `Cryptocurrency - Rank #${coin.market_cap_rank || 'N/A'}`,
          coinGeckoId: coin.id // ¡IMPORTANTE! Guardar el ID de CoinGecko
        });
        
        return newAsset;
      }
    } catch (error) {
      console.error(`[ASSETS] Error creando crypto:`, error);
    }
    
    throw new Error('No se encontró información para este símbolo');
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
    
    // Buscar el activo en la base de datos para determinar el tipo
    const asset = await this.assetRepository.findOne({ where: { symbol } });
    
    // Si es criptomoneda, usar CoinGecko
    if (asset && asset.type === 'crypto') {
      try {
        // Usar el coinGeckoId guardado en la base de datos, o mapear el símbolo
        let coinId = asset.coinGeckoId;
        
        if (!coinId) {
          // Fallback: mapeo manual si no hay coinGeckoId guardado
          const cryptoIdMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'USDT': 'tether',
            'BNB': 'binancecoin',
            'XRP': 'ripple',
            'ADA': 'cardano',
            'SOL': 'solana',
            'DOGE': 'dogecoin',
            'DOT': 'polkadot',
            'MATIC': 'matic-network'
          };
          coinId = cryptoIdMap[symbol] || symbol.toLowerCase();
        }
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
        );
        
        const data = await response.json();
        
        console.log(`[ASSETS] Precio crypto para ${symbol} (coinId: ${coinId}):`, JSON.stringify(data));
        
        if (data[coinId] && data[coinId].usd) {
          const price = data[coinId].usd;
          const change = data[coinId].usd_24h_change || 0;
          
          // Guardar en cache
          this.priceCache.set(symbol, {
            price: price,
            timestamp: now,
            data: {
              change: change,
              changePercent: change,
              volume24h: data[coinId].usd_24h_vol || 0
            }
          });
          
          return {
            symbol: symbol,
            price: price,
            currency: 'USD',
            timestamp: new Date().toISOString(),
            cached: false,
            change: change,
            changePercent: change,
            volume24h: data[coinId].usd_24h_vol || 0,
            type: 'crypto'
          };
        }
      } catch (error) {
        console.error(`[ASSETS] Error obteniendo precio crypto:`, error);
        throw new Error('Precio no disponible para esta criptomoneda');
      }
    }
    
    // Si es acción o no encontrado, usar Finnhub
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
          changePercent: data.dp,
          type: 'stock'
        };
      } else {
        throw new Error('Precio no disponible para este símbolo');
      }
    } catch (error) {
      throw new Error(`Precio no disponible para este símbolo: ${error.message}`);
    }
  }
}
