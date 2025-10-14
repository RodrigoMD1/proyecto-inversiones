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
    console.log('[ASSETS] Creando nuevo asset:', JSON.stringify(createAssetDto, null, 2));
    
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
      
      console.log('[ASSETS] Símbolo genérico o nombre conocido detectado, buscando en Finnhub...');
      
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
            console.log(`[ASSETS] Nombre "${createAssetDto.name}" mapeado a símbolo: ${symbolToCheck}`);
            break;
          }
        }
        
        // Obtener información del símbolo en Finnhub
        const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbolToCheck}&token=${FINNHUB_API_KEY}`);
        const profileData = await profileRes.json();
        
        console.log('[ASSETS] Respuesta de Finnhub:', JSON.stringify(profileData, null, 2));
        
        if (profileData && profileData.name && !profileData.error) {
          finalSymbol = symbolToCheck;
          finalName = profileData.name;
          finalDescription = `${profileData.finnhubIndustry || 'Company'} - ${profileData.exchange || ''}`;
          console.log(`[ASSETS] ✅ Datos reales obtenidos: ${finalName} (${finalSymbol})`);
        } else {
          console.log(`[ASSETS] ⚠️  No se encontró información para "${symbolToCheck}". Usando datos originales.`);
        }
        
      } catch (error) {
        console.log(`[ASSETS] ❌ Error buscando en Finnhub: ${error.message}`);
      }
    }
    
    const asset = this.assetRepository.create({
      symbol: finalSymbol,
      name: finalName,
      type: createAssetDto.type,
      description: finalDescription || createAssetDto.description
    });
    
    const saved = await this.assetRepository.save(asset);
    console.log('[ASSETS] ✅ Asset guardado:', JSON.stringify(saved, null, 2));
    
    return saved;
  }

  // Obtener todos los activos
  async findAll() {
    return await this.assetRepository.find(); // Devuelve todos los activos
  }

  // Buscar assets en Finnhub
  async searchInFinnhub(query: string) {
    console.log(`[ASSETS] Buscando en Finnhub: ${query}`);
    
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
      
      console.log(`[ASSETS] Encontrados ${detailedResults.length} resultados`);
      return { results: detailedResults };
    } catch (error) {
      console.error('[ASSETS] Error en búsqueda:', error);
      return { results: [], error: error.message };
    }
  }

  // Obtener o crear asset (evita duplicados)
  async getOrCreateAsset(symbol: string) {
    console.log(`[ASSETS] Get or create: ${symbol}`);
    
    // Buscar si ya existe
    const existing = await this.assetRepository.findOne({ 
      where: { symbol } 
    });
    
    if (existing) {
      console.log(`[ASSETS] Asset ${symbol} ya existe con ID ${existing.id}`);
      return existing;
    }
    
    // No existe, obtener datos de Finnhub y crear
    console.log(`[ASSETS] Creando nuevo asset: ${symbol}`);
    
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
        
        console.log(`[ASSETS] ✅ Asset creado: ${newAsset.name} (${newAsset.symbol})`);
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
    console.log(`[ASSETS] Obteniendo precio para: ${symbol}`);
    
    // Verificar cache
    const cached = this.priceCache.get(symbol);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`[ASSETS] ✅ Precio de ${symbol} desde cache: $${cached.price}`);
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
      
      console.log(`[ASSETS] Respuesta Finnhub para ${symbol}:`, JSON.stringify(data, null, 2));
      
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
        
        console.log(`[ASSETS] ✅ Precio de ${symbol} desde Finnhub: $${data.c}`);
        
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
        console.log(`[ASSETS] ⚠️ Símbolo ${symbol} no tiene precio disponible`);
        throw new Error('Precio no disponible para este símbolo');
      }
    } catch (error) {
      console.error(`[ASSETS] ❌ Error obteniendo precio:`, error);
      throw new Error(`Precio no disponible para este símbolo: ${error.message}`);
    }
  }
}
