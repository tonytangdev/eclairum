import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileRepositoryImpl } from './file.repository';
import { FileMapper } from './mappers/file.mapper';
import { File } from '@eclairum/core/entities';
import { faker } from '@faker-js/faker';
import { FileEntity } from '../../common/entities/file.entity';

// Mock the FileMapper
jest.mock('./mappers/file.mapper', () => ({
  FileMapper: {
    toDomain: jest.fn(),
    toPersistence: jest.fn(),
  },
}));

describe('FileRepositoryImpl', () => {
  let repository: FileRepositoryImpl;
  let typeOrmRepository: jest.Mocked<Repository<FileEntity>>;

  // Test data
  const testId = faker.string.uuid();
  const testPath = faker.system.filePath();
  const testBucketName = 'test-bucket';
  const testQuizGenerationTaskId = faker.string.uuid();

  // Create reusable entities for testing
  const createFileEntity = () => {
    const entity = new FileEntity();
    entity.id = testId;
    entity.path = testPath;
    entity.bucketName = testBucketName;
    entity.quizGenerationTaskId = testQuizGenerationTaskId;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.deletedAt = null;
    return entity;
  };

  const createDomainFile = () => {
    return new File({
      id: testId,
      path: testPath,
      bucketName: testBucketName,
      quizGenerationTaskId: testQuizGenerationTaskId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  beforeEach(async () => {
    // Create mock for TypeORM repository
    const mockTypeOrmRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileRepositoryImpl,
        {
          provide: getRepositoryToken(FileEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<FileRepositoryImpl>(FileRepositoryImpl);
    typeOrmRepository = module.get(getRepositoryToken(FileEntity));

    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return null when file is not found', async () => {
      // Arrange
      const id = faker.string.uuid();
      typeOrmRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(id);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(typeOrmRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
      expect(FileMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should return mapped file when found', async () => {
      // Arrange
      const fileEntity = createFileEntity();
      const domainFile = createDomainFile();

      typeOrmRepository.findOne.mockResolvedValue(fileEntity);
      (FileMapper.toDomain as jest.Mock).mockReturnValue(domainFile);

      // Act
      const result = await repository.findById(testId);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: testId },
      });
      expect(typeOrmRepository.findOne).toHaveBeenCalledTimes(1);
      expect(FileMapper.toDomain).toHaveBeenCalledWith(fileEntity);
      expect(FileMapper.toDomain).toHaveBeenCalledTimes(1);
      expect(result).toBe(domainFile);
      expect(result?.getId()).toBe(testId);
      expect(result?.getPath()).toBe(testPath);
      expect(result?.getBucketName()).toBe(testBucketName);
      expect(result?.getQuizGenerationTaskId()).toBe(testQuizGenerationTaskId);
    });
  });

  describe('findByQuizGenerationTaskId', () => {
    it('should return null when file is not found', async () => {
      // Arrange
      const quizGenerationTaskId = faker.string.uuid();
      typeOrmRepository.findOne.mockResolvedValue(null);

      // Act
      const result =
        await repository.findByQuizGenerationTaskId(quizGenerationTaskId);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { quizGenerationTaskId },
      });
      expect(typeOrmRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
      expect(FileMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should return mapped file when found', async () => {
      // Arrange
      const fileEntity = createFileEntity();
      const domainFile = createDomainFile();

      typeOrmRepository.findOne.mockResolvedValue(fileEntity);
      (FileMapper.toDomain as jest.Mock).mockReturnValue(domainFile);

      // Act
      const result = await repository.findByQuizGenerationTaskId(
        testQuizGenerationTaskId,
      );

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { quizGenerationTaskId: testQuizGenerationTaskId },
      });
      expect(typeOrmRepository.findOne).toHaveBeenCalledTimes(1);
      expect(FileMapper.toDomain).toHaveBeenCalledWith(fileEntity);
      expect(FileMapper.toDomain).toHaveBeenCalledTimes(1);
      expect(result).toBe(domainFile);
    });
  });

  describe('save', () => {
    it('should persist the file entity and return domain object', async () => {
      // Arrange
      const file = createDomainFile();
      const fileEntity = createFileEntity();

      (FileMapper.toPersistence as jest.Mock).mockReturnValue(fileEntity);
      typeOrmRepository.save.mockResolvedValue(fileEntity);
      (FileMapper.toDomain as jest.Mock).mockReturnValue(file);

      // Act
      const result = await repository.save(file);

      // Assert
      expect(FileMapper.toPersistence).toHaveBeenCalledWith(file);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(fileEntity);
      expect(FileMapper.toDomain).toHaveBeenCalledWith(fileEntity);
      expect(result).toBe(file);
    });

    it('should propagate errors from the database', async () => {
      // Arrange
      const file = createDomainFile();
      const fileEntity = createFileEntity();
      const dbError = new Error('Database error');

      (FileMapper.toPersistence as jest.Mock).mockReturnValue(fileEntity);
      typeOrmRepository.save.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.save(file)).rejects.toThrow(dbError);
      expect(FileMapper.toPersistence).toHaveBeenCalledWith(file);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(fileEntity);
    });
  });

  describe('softDelete', () => {
    it('should update the file entity with a deletedAt timestamp', async () => {
      // Arrange
      const id = faker.string.uuid();
      const beforeTest = new Date();
      typeOrmRepository.update.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });

      // Act
      await repository.softDelete(id);

      // Assert
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id },
        { deletedAt: expect.any(Date) as Date },
      );

      // Verify the timestamp is recent
      const updateData = typeOrmRepository.update.mock.calls[0][1] as {
        deletedAt: Date;
      };
      expect(updateData.deletedAt.getTime()).toBeGreaterThanOrEqual(
        beforeTest.getTime(),
      );
      expect(updateData.deletedAt.getTime()).toBeLessThanOrEqual(
        new Date().getTime(),
      );
    });

    it('should handle when file does not exist', async () => {
      // Arrange
      const id = faker.string.uuid();
      typeOrmRepository.update.mockResolvedValue({
        affected: 0,
        raw: {},
        generatedMaps: [],
      });

      // Act & Assert
      await expect(repository.softDelete(id)).resolves.not.toThrow();
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id },
        { deletedAt: expect.any(Date) as Date },
      );
    });

    it('should propagate database errors', async () => {
      // Arrange
      const id = faker.string.uuid();
      const dbError = new Error('Database error');
      typeOrmRepository.update.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.softDelete(id)).rejects.toThrow(dbError);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id },
        { deletedAt: expect.any(Date) as Date },
      );
    });
  });
});
