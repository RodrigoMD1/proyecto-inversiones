/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private readonly emailService: EmailService // Inyecta el servicio de email
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

  // Reenviar email de verificación
  async resendVerification(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) return { message: 'Usuario no encontrado.' };

    const verificationToken = randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    await this.repo.save(user);

    const verificationUrl = `https://financepr.netlify.app/verify-email?token=${verificationToken}`;
    
    // Envío de email temporalmente deshabilitado para pruebas
    try {
      await this.emailService.sendEmail(
        user.email,
        'Verifica tu email',
        `<p>Haz clic en el siguiente enlace para verificar tu email:</p>
         <a href="${verificationUrl}">${verificationUrl}</a>`
      );
    } catch (error) {
      console.log('⚠️ Error al enviar email (modo prueba):', error.message);
      // En modo de prueba, devolvemos el token para testing manual
      return { 
        message: 'Correo de verificación generado (modo prueba).', 
        verificationToken,
        verificationUrl 
      };
    }

    return { message: 'Correo de verificación reenviado.' };
  }
}