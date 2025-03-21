import { UserMapper } from './user.mapper';
import { User } from '@eclairum/core/entities';
import { faker } from '@faker-js/faker';
import { UserEntity } from '../../../common/entities/user.entity';

describe('UserMapper', () => {
  describe('toDomain', () => {
    it('should map a UserEntity to a User domain object', () => {
      // Arrange
      const now = new Date();
      const entity = new UserEntity();
      entity.id = faker.string.uuid();
      entity.email = faker.internet.email();
      entity.createdAt = now;
      entity.updatedAt = now;
      entity.deletedAt = null;

      // Act
      const result = UserMapper.toDomain(entity);

      // Assert
      expect(result).toBeInstanceOf(User);
      expect(result.getId()).toBe(entity.id);
      expect(result.getEmail()).toBe(entity.email.toLowerCase());
      expect(result.getCreatedAt()).toBe(entity.createdAt);
      expect(result.getUpdatedAt()).toBe(entity.updatedAt);
      expect(result.getDeletedAt()).toBe(entity.deletedAt);
    });

    it('should handle entity with deletedAt value', () => {
      // Arrange
      const now = new Date();
      const deletedAt = new Date(now.getTime() + 1000);
      const entity = new UserEntity();
      entity.id = faker.string.uuid();
      entity.email = faker.internet.email();
      entity.createdAt = now;
      entity.updatedAt = now;
      entity.deletedAt = deletedAt;

      // Act
      const result = UserMapper.toDomain(entity);

      // Assert
      expect(result.getDeletedAt()).toEqual(deletedAt);
    });
  });

  describe('toPersistence', () => {
    it('should map a User domain object to a UserEntity', () => {
      // Arrange
      const now = new Date();
      const id = faker.string.uuid();
      const email = faker.internet.email();
      const user = new User({
        id,
        email,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      // Act
      const result = UserMapper.toPersistence(user);

      // Assert
      expect(result).toBeInstanceOf(UserEntity);
      expect(result.id).toBe(id);
      expect(result.email).toBe(email.toLowerCase());
      expect(result.createdAt).toBe(now);
      expect(result.updatedAt).toBe(now);
      expect(result.deletedAt).toBeNull();
    });

    it('should handle domain object with deletedAt value', () => {
      // Arrange
      const now = new Date();
      const deletedAt = new Date(now.getTime() + 1000);
      const user = new User({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        createdAt: now,
        updatedAt: now,
        deletedAt: deletedAt,
      });

      // Act
      const result = UserMapper.toPersistence(user);

      // Assert
      expect(result.deletedAt).toEqual(deletedAt);
    });
  });

  describe('bidirectional mapping', () => {
    it('should preserve data integrity when mapping in both directions', () => {
      // Arrange
      const id = faker.string.uuid();
      const email = faker.internet.email();
      const now = new Date();

      // Create initial domain object
      const originalUser = new User({
        id,
        email,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      // Act
      // Convert to persistence entity
      const entity = UserMapper.toPersistence(originalUser);
      // Convert back to domain
      const resultUser = UserMapper.toDomain(entity);

      // Assert
      expect(resultUser.getId()).toBe(originalUser.getId());
      expect(resultUser.getEmail()).toBe(originalUser.getEmail());
      expect(resultUser.getCreatedAt()).toBe(originalUser.getCreatedAt());
      expect(resultUser.getUpdatedAt()).toBe(originalUser.getUpdatedAt());
      expect(resultUser.getDeletedAt()).toBe(originalUser.getDeletedAt());
    });
  });
});
