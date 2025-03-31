import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [RepositoriesModule, SubscriptionsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
