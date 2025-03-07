import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '@flash-me/core/interfaces/user-repository.interface';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from './mappers/user.mapper';
import { User } from '@flash-me/core/entities';

@Injectable()
export class RelationalUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { email },
    });

    if (!userEntity) {
      return null;
    }

    return UserMapper.toDomain(userEntity);
  }

  async save(user: User): Promise<User> {
    const userEntity = UserMapper.toPersistence(user);
    const savedEntity = await this.userRepository.save(userEntity);
    return UserMapper.toDomain(savedEntity);
  }
}
