import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // Importamos InjectRepository
import { Repository } from 'typeorm'; // Importamos Repository
import { Asset } from './entities/asset.entity'; // Importamos la entidad Asset
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>, // Inyectamos el repositorio de Asset
  ) {}

  // Crear un nuevo activo
  async create(createAssetDto: CreateAssetDto) {
    const asset = this.assetRepository.create(createAssetDto); // Creamos la entidad a partir del DTO
    return await this.assetRepository.save(asset); // Guardamos el activo en la base de datos
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
