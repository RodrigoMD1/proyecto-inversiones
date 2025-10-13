import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePortfolioDto {
  // Campos opcionales porque pueden venir de assetId
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  ticker?: string;

  // Campo nuevo que envía el frontend
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  assetId?: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  // Aceptar tanto purchasePrice como purchase_price
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  purchase_price?: number;

  // Aceptar tanto purchaseDate como purchase_date
  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @IsOptional()
  @IsString()
  purchase_date?: string;
}