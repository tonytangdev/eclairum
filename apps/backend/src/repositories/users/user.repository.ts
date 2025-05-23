import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '@eclairum/core/interfaces/user-repository.interface';
import { UserMapper } from './mappers/user.mapper';
import { User } from '@eclairum/core/entities';
import { UserEntity } from '../../common/entities/user.entity';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.findUserEntityByEmail(email);
    return this.mapEntityToDomainIfExists(userEntity);
  }

  async findById(id: User['id']): Promise<User | null> {
    const userEntity = await this.findUserEntityById(id);
    return this.mapEntityToDomainIfExists(userEntity);
  }

  async save(user: User): Promise<User> {
    const userEntity = this.mapDomainToPersistence(user);
    const savedEntity = await this.saveUserEntity(userEntity);
    return this.mapEntityToDomain(savedEntity);
  }

  private async findUserEntityByEmail(
    email: string,
  ): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  private async findUserEntityById(id: User['id']): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  private mapEntityToDomainIfExists(entity: UserEntity | null): User | null {
    if (!entity) {
      return null;
    }
    return this.mapEntityToDomain(entity);
  }

  private mapEntityToDomain(entity: UserEntity): User {
    return UserMapper.toDomain(entity);
  }

  private mapDomainToPersistence(user: User): UserEntity {
    return UserMapper.toPersistence(user);
  }

  private async saveUserEntity(entity: UserEntity): Promise<UserEntity> {
    return await this.userRepository.save(entity);
  }
}
