import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './auth/entities/user.entity';
import { Asset } from './assets/entities/asset.entity';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PortfolioItem } from './portfolio/entities/portfolio.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres', // O el tipo de base de datos que estés usando
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Asset,PortfolioItem],
      synchronize: true, // En desarrollo lo puedes dejar en true, pero en producción debe estar en false
    }),
    UsersModule,
    AssetsModule,
    PortfolioModule,
    AuthModule,
  ],
})
export class AppModule {}