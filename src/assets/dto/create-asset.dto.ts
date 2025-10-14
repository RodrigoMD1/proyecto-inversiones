import { IsIn, IsNotEmpty } from 'class-validator';

export class CreateAssetDto {
    @IsNotEmpty()
    symbol: string;

    @IsNotEmpty()
    name: string;

    @IsIn(['crypto', 'stock', 'forex'])
    type: 'crypto' | 'stock' | 'forex';

    description?: string;

    coinGeckoId?: string; // ID de CoinGecko para criptomonedas
}