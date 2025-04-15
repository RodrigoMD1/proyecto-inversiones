import { IsString, IsNotEmpty, IsNumber } from 'class-validator';


export class CreatePortfolioDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Nombre del activo (ej. 'Tesla', 'Bitcoin')

  @IsString()
  @IsNotEmpty()
  description: string; // Descripción del activo

  @IsString()
  @IsNotEmpty()
  type: string; // Tipo de activo (ej. 'Stock', 'Cryptocurrency', 'Bond', etc.)

  @IsNumber()
  @IsNotEmpty()
  quantity: number; // Cantidad de activos (ej. 10 acciones, 5 BTC)

  @IsNumber()
  @IsNotEmpty()
  purchase_price: number; // Precio de compra por unidad del activo

  @IsString()
  @IsNotEmpty()
  user_id: string; // ID del usuario asociado a este activo
}