import { FileMapper } from './file.mapper';
import { File } from '@eclairum/core/entities';
import { faker } from '@faker-js/faker';
import { FileEntity } from '../../../common/entities/file.entity';

describe('FileMapper', () => {
  describe('toDomain', () => {
    it('should map a FileEntity to a File domain object', () => {
      // Arrange
      const now = new Date();
      const entity = new FileEntity();
      entity.id = faker.string.uuid();
      entity.path = faker.system.filePath();
      entity.bucketName = 'test-bucket';
      entity.quizGenerationTaskId = faker.string.uuid();
      entity.createdAt = now;
      entity.updatedAt = now;
      entity.deletedAt = null;

      // Act
      const result = FileMapper.toDomain(entity);

      // Assert
      expect(result).toBeInstanceOf(File);
      expect(result.getId()).toBe(entity.id);
      expect(result.getPath()).toBe(entity.path);
      expect(result.getBucketName()).toBe(entity.bucketName);
      expect(result.getQuizGenerationTaskId()).toBe(
        entity.quizGenerationTaskId,
      );
      expect(result.getCreatedAt()).toBe(entity.createdAt);
      expect(result.getUpdatedAt()).toBe(entity.updatedAt);
      expect(result.getDeletedAt()).toBe(entity.deletedAt);
    });

    it('should handle entity with deletedAt value', () => {
      // Arrange
      const now = new Date();
      const deletedAt = new Date(now.getTime() + 1000);
      const entity = new FileEntity();
      entity.id = faker.string.uuid();
      entity.path = faker.system.filePath();
      entity.bucketName = 'test-bucket';
      entity.quizGenerationTaskId = faker.string.uuid();
      entity.createdAt = now;
      entity.updatedAt = now;
      entity.deletedAt = deletedAt;

      // Act
      const result = FileMapper.toDomain(entity);

      // Assert
      expect(result.getDeletedAt()).toEqual(deletedAt);
      expect(result.isDeleted()).toBe(true);
    });
  });

  describe('toPersistence', () => {
    it('should map a File domain object to a FileEntity', () => {
      // Arrange
      const now = new Date();
      const id = faker.string.uuid();
      const path = faker.system.filePath();
      const bucketName = 'test-bucket';
      const quizGenerationTaskId = faker.string.uuid();
      const file = new File({
        id,
        path,
        bucketName,
        quizGenerationTaskId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      // Act
      const result = FileMapper.toPersistence(file);

      // Assert
      expect(result).toBeInstanceOf(FileEntity);
      expect(result.id).toBe(id);
      expect(result.path).toBe(path);
      expect(result.bucketName).toBe(bucketName);
      expect(result.quizGenerationTaskId).toBe(quizGenerationTaskId);
      expect(result.createdAt).toBe(now);
      expect(result.updatedAt).toBe(now);
      expect(result.deletedAt).toBeNull();
    });

    it('should handle domain object with deletedAt value', () => {
      // Arrange
      const now = new Date();
      const deletedAt = new Date(now.getTime() + 1000);
      const file = new File({
        id: faker.string.uuid(),
        path: faker.system.filePath(),
        bucketName: 'test-bucket',
        quizGenerationTaskId: faker.string.uuid(),
        createdAt: now,
        updatedAt: now,
        deletedAt,
      });

      // Act
      const result = FileMapper.toPersistence(file);

      // Assert
      expect(result.deletedAt).toEqual(deletedAt);
    });
  });
});
