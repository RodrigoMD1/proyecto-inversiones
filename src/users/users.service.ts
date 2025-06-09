import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>
  ) { }

  // Solo para uso interno o admin, no para registro público
  async create(createUserDto: CreateUserDto) {
    const user = this.repo.create({
      ...createUserDto,
      emailVerified: false,
      emailVerificationToken: null,
    });
    return this.repo.save(user);
  }

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id: id.toString() }, relations: ['portfolio'] });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.repo.update(id, updateUserDto);
    return this.repo.findOne({ where: { id: id.toString() } });
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  // Actualizar configuración de reportes automáticos
  async updateReportConfig(id: string, config: { reportEnabled: boolean; reportFrequency: string }) {
    await this.repo.update(id, config);
    return this.repo.findOne({ where: { id } });
  }

  // Verificar email con token
  async verifyEmail(token: string) {
    const user = await this.repo.findOne({ where: { emailVerificationToken: token } });
    if (!user) return null;
    user.emailVerified = true;
    user.emailVerificationToken = null;
    await this.repo.save(user);
    return user;
  }

  // Reenviar email de verificación (opcional, si lo usas desde aquí)
  // Si no lo usas, puedes eliminar este método
  /*
  async resendVerification(id: string) {
    // Implementar si lo necesitas
  }
  */
}