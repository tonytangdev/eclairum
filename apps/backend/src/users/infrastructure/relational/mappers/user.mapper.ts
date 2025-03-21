import { Injectable } from '@nestjs/common';
import { User } from '@eclairum/core/entities';
import { UserEntity } from '../../../../common/entities/user.entity';

@Injectable()
export class UserMapper {
  static toDomain(entity: UserEntity): User {
    const user = new User({
      id: entity.id,
      email: entity.email,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
    return user;
  }

  static toPersistence(domain: User): UserEntity {
    const entity = new UserEntity();
    entity.id = domain.getId();
    entity.email = domain.getEmail();
    entity.createdAt = domain.getCreatedAt();
    entity.updatedAt = domain.getUpdatedAt();
    entity.deletedAt = domain.getDeletedAt();
    return entity;
  }
}
