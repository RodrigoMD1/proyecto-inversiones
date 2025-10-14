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
}
