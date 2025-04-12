import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';


@Module({
  imports: [UsersModule, AssetsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
