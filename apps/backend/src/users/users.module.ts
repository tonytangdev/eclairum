import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infrastructure/relational/entities/user.entity';
import { UsersService } from './users.service';
import { UserRepositoryImpl } from '../repositories/users/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
  providers: [UsersService, UserRepositoryImpl],
  exports: [UserRepositoryImpl],
})
export class UsersModule {}
