import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePortfolioDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  purchase_price: number;

  @IsString()
  @IsNotEmpty()
  purchase_date: string;

  @IsString()
  @IsNotEmpty()
  ticker: string;
}