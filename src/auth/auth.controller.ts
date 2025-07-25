import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Auth, GetUser } from './decorators';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
import { ValidRoles } from './interfaces';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }


  ////////////////////////////////////////////////////////////////////
  @Post('registro')
  @ApiResponse({ status: 201, description: 'Usuario creado correctamente.' })
  @ApiResponse({ status: 400, description: 'Bad Request — Validación fallida.' })
  createUser(@Body() createUserDto: CreateUserDto) {
    
    return this.authService.create(createUserDto);
  }
  ////////////////////////////////////////////////////////////////////
  @Post('login')
  @ApiResponse({ status: 200, description: 'Login exitoso.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  ////////////////////////////////////////////////////////////////////

  @Get('check-status')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Estado de autenticación válido.' })
  @Auth()
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }
  ////////////////////////////////////////////////////////////////////

  @Get('Panel-Administrador')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Acceso concedido a administrador.' })
  @Auth(ValidRoles.admin)
  privateRoute3(@GetUser() user: User) {
    return {
      ok: true,
      user
    };
  }
}