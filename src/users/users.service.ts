import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) { }

  // Crear usuario y enviar email de verificación
  async create(createUserDto: CreateUserDto) {
    const verificationToken = randomBytes(32).toString('hex');
    const user = this.repo.create({
      ...createUserDto,
      emailVerified: false,
      emailVerificationToken: verificationToken,
    });
    const savedUser = await this.repo.save(user);

    // Aquí deberías enviar el email de verificación (puedes inyectar ReportService o usar un EmailService)
    // Ejemplo:
    // const verificationUrl = `https://TU_DOMINIO.com/verify-email?token=${verificationToken}`;
    // await this.reportService.sendEmail(
    //   savedUser.email,
    //   'Verifica tu email',
    //   `<p>Haz clic en el siguiente enlace para verificar tu email:</p>
    //    <a href="${verificationUrl}">${verificationUrl}</a>`
    // );

    return savedUser;
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
}