import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto, LoginUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService, // Inyecta el servicio de email
  ) { }

  ////////////////////////////////////////////////////////////////////
  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;
      const hashedPassword = bcrypt.hashSync(password, 15);

      // Crear usuario SIN token de verificación inicialmente
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        emailVerified: false,
        emailVerificationToken: null, // No generar token hasta enviar el email
      });

      await this.userRepository.save(user);
      delete user.password;

      // Generar token y enviar email de verificación
      const verificationToken = randomBytes(32).toString('hex');
      
      // Actualizar el usuario con el token
      await this.userRepository.update(user.id, {
        emailVerificationToken: verificationToken
      });

      try {
        const verificationUrl = `https://financepr.netlify.app/verify-email?token=${verificationToken}`;
        await this.emailService.sendEmail(
          user.email,
          'Verifica tu email',
          `<p>Haz clic en el siguiente enlace para verificar tu email:</p>
           <a href="${verificationUrl}">${verificationUrl}</a>`
        );
        console.log(`✅ Email de verificación enviado a: ${user.email}`);
      } catch (emailError) {
        console.log(`⚠️ Error al enviar email de verificación (modo prueba): ${emailError.message}`);
        // En modo de desarrollo, mantener el token para pruebas manuales
        // En producción, podrías limpiar el token si el email falla
      }

      return {
        ...user,
        token: this.getJwtToken({ id: user.id })
      }
    } catch (error) {
      this.handleDBErrors(error);
    }
  }
  ////////////////////////////////////////////////////////////////////

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, id: true, name: true, roles: true, password: true }
    });

    if (!user)
      throw new UnauthorizedException('las credenciales no son validas (email)');

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('las credenciales no son validas (contraseña)')

    return {
      ...user,
      token: this.getJwtToken({ id: user.id })
    };
  }

  ////////////////////////////////////////////////////////////////////

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }
  ////////////////////////////////////////////////////////////////////

  async checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({ id: user.id })
    };
  }
  ////////////////////////////////////////////////////////////////////

  // manejador de errores 
  private handleDBErrors(error: any): void {
    // Puedes dejar este log solo para desarrollo, elimínalo en producción si no lo necesitas
    // console.log(error);

    if (error.code === '23505') {
      throw new BadRequestException(error.detail); // Error de clave duplicada
    }

    // Manejo adicional de otros códigos de error de la base de datos
    if (error.code === '23502') { // Error de campo nulo (violación de restricción NOT NULL)
      throw new BadRequestException('Faltan campos obligatorios');
    }

    throw new InternalServerErrorException('Por favor verificar el servidor de logs');
  }
}