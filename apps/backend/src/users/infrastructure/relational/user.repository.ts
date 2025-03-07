import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@flash-me/core/entities/user';
import { UserRepository } from '@flash-me/core/interfaces/user-repository.interface';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from './mappers/user.mapper';

@Injectable()
export class RelationalUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly userMapper: UserMapper,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({
      where: { email },
    });

    if (!userEntity) {
      return null;
    }

    return this.userMapper.toDomain(userEntity);
  }

  async save(user: User): Promise<User> {
    const userEntity = this.userMapper.toPersistence(user);
    const savedEntity = await this.userRepository.save(userEntity);
    return this.userMapper.toDomain(savedEntity);
  }
}
