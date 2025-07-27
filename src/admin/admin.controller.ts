import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService, UserSummary, AdminStats } from './admin.service';
import { Auth } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { AdminGuard } from 'src/guards/admin.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@Auth(ValidRoles.admin) // Solo usuarios admin
@UseGuards(AdminGuard) // Doble protección
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas generales del sistema' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getAdminStats(): Promise<AdminStats> {
    return this.adminService.getAdminStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Obtener lista de todos los usuarios con detalles' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente' })
  async getAllUsers(): Promise<UserSummary[]> {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:userId/subscription')
  @ApiOperation({ summary: 'Actualizar plan de suscripción de un usuario' })
  @ApiResponse({ status: 200, description: 'Suscripción actualizada exitosamente' })
  async updateUserSubscription(
    @Param('userId') userId: string,
    @Body() body: { plan: 'FREE' | 'PREMIUM' }
  ) {
    return this.adminService.updateUserSubscription(userId, body.plan);
  }

  @Patch('users/:userId/toggle-status')
  @ApiOperation({ summary: 'Activar/desactivar un usuario' })
  @ApiResponse({ status: 200, description: 'Estado del usuario actualizado' })
  async toggleUserStatus(@Param('userId') userId: string) {
    return this.adminService.toggleUserStatus(userId);
  }

  @Post('users/:userId/verify-email')
  @ApiOperation({ summary: 'Verificar email de usuario manualmente' })
  @ApiResponse({ status: 200, description: 'Email verificado exitosamente' })
  async verifyUserEmail(@Param('userId') userId: string) {
    return this.adminService.verifyUserEmail(userId);
  }

  @Delete('users/:userId')
  @ApiOperation({ summary: 'Eliminar usuario y todos sus datos' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  async deleteUser(@Param('userId') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Patch('users/:userId/roles')
  @ApiOperation({ summary: 'Actualizar roles de un usuario' })
  @ApiResponse({ status: 200, description: 'Roles actualizados exitosamente' })
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() body: { roles: string[] }
  ) {
    return this.adminService.updateUserRole(userId, body.roles);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Obtener detalles específicos de un usuario' })
  @ApiResponse({ status: 200, description: 'Detalles del usuario obtenidos' })
  async getUserDetails(@Param('userId') userId: string) {
    const users = await this.adminService.getAllUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    return user;
  }
}
