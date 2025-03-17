import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { QuizGenerationTaskRepositoryImpl } from './quiz-generation-task.repository';
import { QuizGenerationTaskEntity } from '../entities/quiz-generation-task.entity';
import { QuizGenerationTaskMapper } from '../mappers/quiz-generation-task.mapper';
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from '@eclairum/core/entities';
import { faker } from '@faker-js/faker';

describe('QuizGenerationTaskRepositoryImpl', () => {
  let repository: QuizGenerationTaskRepositoryImpl;
  let typeOrmRepository: jest.Mocked<Repository<QuizGenerationTaskEntity>>;

  // Helper functions to create test data
  const createMockTask = (overrides = {}) =>
    new QuizGenerationTask({
      id: faker.string.uuid(),
      textContent: faker.lorem.paragraphs(2),
      status: QuizGenerationStatus.PENDING,
      questions: [],
      userId: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

  const createMockEntity = (task: QuizGenerationTask) => {
    const entity = new QuizGenerationTaskEntity();
    entity.id = task.getId();
    entity.textContent = task.getTextContent();
    entity.status = task.getStatus();
    entity.questions = [];
    entity.userId = task.getUserId();
    entity.createdAt = task.getCreatedAt();
    entity.updatedAt = task.getUpdatedAt();
    return entity;
  };

  beforeEach(async () => {
    // Create a mock TypeORM repository
    const mockTypeOrmRepository = {
      save: jest.fn().mockReturnValue(Promise.resolve({})),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizGenerationTaskRepositoryImpl,
        {
          provide: getRepositoryToken(QuizGenerationTaskEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<QuizGenerationTaskRepositoryImpl>(
      QuizGenerationTaskRepositoryImpl,
    );
    typeOrmRepository = module.get(
      getRepositoryToken(QuizGenerationTaskEntity),
    );

    // Spy on QuizGenerationTaskMapper
    jest.spyOn(QuizGenerationTaskMapper, 'toEntity');
    jest.spyOn(QuizGenerationTaskMapper, 'toDomain');
    jest.spyOn(QuizGenerationTaskMapper, 'toDomainList');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveTask', () => {
    it('should call save method with the task', async () => {
      // Arrange
      const task = createMockTask();
      jest.spyOn(repository, 'save').mockResolvedValueOnce(task);

      // Act
      await repository.saveTask(task);

      // Assert
      expect(repository.save).toHaveBeenCalledWith(task);
    });
  });

  describe('save', () => {
    it('should save a task using the repository when no entity manager is provided', async () => {
      // Arrange
      const task = createMockTask();
      const entity = createMockEntity(task);

      QuizGenerationTaskMapper.toEntity = jest.fn().mockReturnValueOnce(entity);

      // Act
      const result = await repository.save(task);

      // Assert
      expect(QuizGenerationTaskMapper.toEntity).toHaveBeenCalledWith(task);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(task);
    });

    it('should handle save errors and propagate them', async () => {
      // Arrange
      const task = createMockTask();
      const error = new Error('Database error');
      const entity = createMockEntity(task);

      QuizGenerationTaskMapper.toEntity = jest.fn().mockReturnValueOnce(entity);
      typeOrmRepository.save.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(repository.save(task)).rejects.toThrow(error);
      expect(QuizGenerationTaskMapper.toEntity).toHaveBeenCalledWith(task);
    });

    it('should use provided entity manager when available', async () => {
      // Arrange
      const task = createMockTask();
      const entity = createMockEntity(task);

      QuizGenerationTaskMapper.toEntity = jest.fn().mockReturnValueOnce(entity);

      const mockTransactionRepo = {
        save: jest.fn().mockReturnValue(Promise.resolve(entity)),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      // Act
      const result = await repository.save(task, mockEntityManager);

      // Assert
      expect(QuizGenerationTaskMapper.toEntity).toHaveBeenCalledWith(task);
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        QuizGenerationTaskEntity,
      );
      expect(mockTransactionRepo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(task);
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a task when found by ID', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const task = createMockTask({ id: taskId });
      const entity = createMockEntity(task);

      typeOrmRepository.findOne.mockResolvedValueOnce(entity);
      QuizGenerationTaskMapper.toDomain = jest.fn().mockReturnValueOnce(task);

      // Act
      const result = await repository.findById(taskId);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['questions'],
      });
      expect(QuizGenerationTaskMapper.toDomain).toHaveBeenCalledWith(entity);
      expect(result).toBe(task);
    });

    it('should return null when no task is found', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      typeOrmRepository.findOne.mockResolvedValueOnce(null);

      // Act
      const result = await repository.findById(taskId);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['questions'],
      });
      expect(result).toBeNull();
      expect(QuizGenerationTaskMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should use stored entity manager when available', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const task = createMockTask({ id: taskId });
      const entity = createMockEntity(task);

      const mockTransactionRepo = {
        findOne: jest.fn().mockResolvedValueOnce(entity),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      repository.setEntityManager(mockEntityManager);
      QuizGenerationTaskMapper.toDomain = jest.fn().mockReturnValueOnce(task);

      // Act
      const result = await repository.findById(taskId);

      // Assert
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        QuizGenerationTaskEntity,
      );
      expect(mockTransactionRepo.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['questions'],
      });
      expect(QuizGenerationTaskMapper.toDomain).toHaveBeenCalledWith(entity);
      expect(result).toBe(task);
      expect(typeOrmRepository.findOne).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const dbError = new Error('Database error');
      typeOrmRepository.findOne.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.findById(taskId)).rejects.toThrow(dbError);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['questions'],
      });
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      // Arrange
      const tasks = [createMockTask(), createMockTask()];
      const entities = tasks.map((task) => createMockEntity(task));

      typeOrmRepository.find.mockResolvedValueOnce(entities);
      QuizGenerationTaskMapper.toDomainList = jest
        .fn()
        .mockReturnValueOnce(tasks);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        relations: ['questions'],
      });
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith(
        entities,
      );
      expect(result).toBe(tasks);
    });

    it('should return empty array when no tasks are found', async () => {
      // Arrange
      typeOrmRepository.find.mockResolvedValueOnce([]);
      QuizGenerationTaskMapper.toDomainList = jest.fn().mockReturnValueOnce([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith([]);
    });

    it('should use stored entity manager when available', async () => {
      // Arrange
      const tasks = [createMockTask(), createMockTask()];
      const entities = tasks.map((task) => createMockEntity(task));

      const mockTransactionRepo = {
        find: jest.fn().mockResolvedValueOnce(entities),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      repository.setEntityManager(mockEntityManager);
      QuizGenerationTaskMapper.toDomainList = jest
        .fn()
        .mockReturnValueOnce(tasks);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        QuizGenerationTaskEntity,
      );
      expect(mockTransactionRepo.find).toHaveBeenCalledWith({
        relations: ['questions'],
      });
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith(
        entities,
      );
      expect(result).toBe(tasks);
      expect(typeOrmRepository.find).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database error');
      typeOrmRepository.find.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.findAll()).rejects.toThrow(dbError);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        relations: ['questions'],
      });
    });
  });

  describe('setEntityManager', () => {
    it('should store the entity manager for future use', async () => {
      // Arrange
      const task = createMockTask();
      const entity = createMockEntity(task);

      QuizGenerationTaskMapper.toEntity = jest.fn().mockReturnValue(entity);

      const mockTransactionRepo = {
        save: jest.fn().mockReturnValue(Promise.resolve(entity)),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      // Act
      repository.setEntityManager(mockEntityManager);
      await repository.save(task);

      // Assert
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        QuizGenerationTaskEntity,
      );
      expect(mockTransactionRepo.save).toHaveBeenCalledWith(entity);
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });
  });
});
