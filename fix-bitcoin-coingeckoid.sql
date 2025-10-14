-- Script para corregir el coinGeckoId de criptomonedas existentes
-- Ejecutar SOLO UNA VEZ en tu base de datos de producción

-- Actualizar Bitcoin
UPDATE asset 
SET "coinGeckoId" = 'bitcoin' 
WHERE symbol = 'BTC' AND type = 'crypto';

-- Actualizar Ethereum (si existe)
UPDATE asset 
SET "coinGeckoId" = 'ethereum' 
WHERE symbol = 'ETH' AND type = 'crypto';

-- Actualizar Dogecoin (si existe)
UPDATE asset 
SET "coinGeckoId" = 'dogecoin' 
WHERE symbol = 'DOGE' AND type = 'crypto';

-- Actualizar Tether (si existe)
UPDATE asset 
SET "coinGeckoId" = 'tether' 
WHERE symbol = 'USDT' AND type = 'crypto';

-- Actualizar Binance Coin (si existe)
UPDATE asset 
SET "coinGeckoId" = 'binancecoin' 
WHERE symbol = 'BNB' AND type = 'crypto';

-- Actualizar Ripple (si existe)
UPDATE asset 
SET "coinGeckoId" = 'ripple' 
WHERE symbol = 'XRP' AND type = 'crypto';

-- Actualizar Cardano (si existe)
UPDATE asset 
SET "coinGeckoId" = 'cardano' 
WHERE symbol = 'ADA' AND type = 'crypto';

-- Actualizar Solana (si existe)
UPDATE asset 
SET "coinGeckoId" = 'solana' 
WHERE symbol = 'SOL' AND type = 'crypto';

-- Actualizar Polkadot (si existe)
UPDATE asset 
SET "coinGeckoId" = 'polkadot' 
WHERE symbol = 'DOT' AND type = 'crypto';

-- Actualizar Polygon (si existe)
UPDATE asset 
SET "coinGeckoId" = 'matic-network' 
WHERE symbol = 'MATIC' AND type = 'crypto';

-- Verificar los cambios
SELECT id, symbol, name, type, "coinGeckoId" 
FROM asset 
WHERE type = 'crypto'
ORDER BY symbol;
