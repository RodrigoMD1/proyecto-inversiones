import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto, LoginUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';



@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)

    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,

  ) { }


  ////////////////////////////////////////////////////////////////////
  async create(createUserDto: CreateUserDto) {
    try {

      const { password, ...userData } = createUserDto;
      const hashedPassword = bcrypt.hashSync(password, 15);
      console.log('Contraseña cifrada:', hashedPassword); // Agregar log de la contraseña cifrada


      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 15)

      });

      await this.userRepository.save(user)
      delete user.password

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
      select: { email: true, password: true, id: true }
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
    console.log(error); // Agregar log para ver el error completo

    if (error.code === '23505') {
      throw new BadRequestException(error.detail); // Error de clave duplicada
    }

    // Manejo adicional de otros códigos de error de la base de datos
    if (error.code === '23502') { // Error de campo nulo (violación de restricción NOT NULL)
      throw new BadRequestException('Faltan campos obligatorios');
    }

    throw new InternalServerErrorException('Por favor verificar el servidor de logs');
  }
  // TODO  seguir con el jwt del token la siguiente parte sigue en las interfaces tengo que hacerlas,tambien en auth module esta el jwt que lo conecto ahi con en .env,el controller lo puedo poner cuando termino todo el auth ya que es separado de los productos es como otra pagina aparte 




}
