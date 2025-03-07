import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './infrastructure/relational/entities/user.entity';
import { UsersService } from './users.service';
import { RelationalUserRepository } from './infrastructure/relational/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
  providers: [UsersService, RelationalUserRepository],
})
export class UsersModule {}
