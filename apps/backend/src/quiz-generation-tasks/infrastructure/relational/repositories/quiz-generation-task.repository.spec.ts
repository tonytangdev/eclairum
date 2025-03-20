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
import { QuestionEntity } from '../../../../questions/infrastructure/relational/entities/question.entity';
import { AnswerEntity } from '../../../../answers/infrastructure/relational/entities/answer.entity';

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

  // Fixed helper function to create mock entities with proper structure
  const createMockEntityWithQuestionsAndAnswers = (
    task: QuizGenerationTask,
  ) => {
    const entity = createMockEntity(task);

    entity.questions = Array(2)
      .fill(null)
      .map(() => {
        const questionId = faker.string.uuid();

        const questionEntity = new QuestionEntity();
        questionEntity.id = questionId;
        questionEntity.content = faker.lorem.sentence();
        questionEntity.quizGenerationTaskId = entity.id;
        questionEntity.createdAt = new Date();
        questionEntity.updatedAt = new Date();
        questionEntity.deletedAt = null;

        questionEntity.answers = Array(2)
          .fill(null)
          .map((_, aIndex) => {
            const answerEntity = new AnswerEntity();
            answerEntity.id = faker.string.uuid();
            answerEntity.content = faker.lorem.sentence();
            answerEntity.isCorrect = aIndex === 0; // First answer is correct
            answerEntity.questionId = questionId;
            answerEntity.createdAt = new Date();
            answerEntity.updatedAt = new Date();
            answerEntity.deletedAt = null;
            return answerEntity;
          });

        return questionEntity;
      });

    return entity;
  };

  beforeEach(async () => {
    // Create a mock TypeORM repository
    const mockTypeOrmRepository = {
      save: jest.fn().mockReturnValue(Promise.resolve({})),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(), // Add count method for pagination tests
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
    it('should persist a task to the database', async () => {
      // Given
      const task = createMockTask();
      const entity = createMockEntity(task);

      QuizGenerationTaskMapper.toEntity = jest.fn().mockReturnValueOnce(entity);
      typeOrmRepository.save.mockResolvedValueOnce(entity);

      // When
      await repository.saveTask(task);

      // Then
      expect(typeOrmRepository.save).toHaveBeenCalled();
      // Only verify behavior that matters to consumers of the repository
    });
  });

  describe('save', () => {
    it('should save a task using the repository when no entity manager is provided', async () => {
      // Given
      const task = createMockTask();
      const entity = createMockEntity(task);

      QuizGenerationTaskMapper.toEntity = jest.fn().mockReturnValueOnce(entity);

      // When
      const result = await repository.save(task);

      // Then
      expect(QuizGenerationTaskMapper.toEntity).toHaveBeenCalledWith(task);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(task);
    });

    it('should handle save errors and propagate them', async () => {
      // Given
      const task = createMockTask();
      const error = new Error('Database error');
      const entity = createMockEntity(task);

      QuizGenerationTaskMapper.toEntity = jest.fn().mockReturnValueOnce(entity);
      typeOrmRepository.save.mockRejectedValueOnce(error);

      // When & Then
      await expect(repository.save(task)).rejects.toThrow(error);
      expect(QuizGenerationTaskMapper.toEntity).toHaveBeenCalledWith(task);
    });

    it('should use provided entity manager when available', async () => {
      // Given
      const task = createMockTask();
      const entity = createMockEntity(task);

      QuizGenerationTaskMapper.toEntity = jest.fn().mockReturnValueOnce(entity);

      const mockTransactionRepo = {
        save: jest.fn().mockReturnValue(Promise.resolve(entity)),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      // When
      const result = await repository.save(task, mockEntityManager);

      // Then
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
    it('should retrieve a complete task with questions and answers', async () => {
      // Given
      const taskId = faker.string.uuid();
      const task = createMockTask({ id: taskId });
      const entity = createMockEntityWithQuestionsAndAnswers(task);

      typeOrmRepository.findOne.mockResolvedValueOnce(entity);
      QuizGenerationTaskMapper.toDomain = jest.fn().mockReturnValueOnce(task);

      // When
      const result = await repository.findById(taskId);

      // Then
      expect(result).toBe(task);
      // Verify relations are specified correctly (important for behavior)
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['questions', 'questions.answers'],
        }),
      );
    });

    it('should return null when the task does not exist', async () => {
      // Given
      const nonExistentTaskId = faker.string.uuid();
      typeOrmRepository.findOne.mockResolvedValueOnce(null);

      // When
      const result = await repository.findById(nonExistentTaskId);

      // Then
      expect(result).toBeNull();
    });

    it('should use stored entity manager when available', async () => {
      // Given
      const taskId = faker.string.uuid();
      const task = createMockTask({ id: taskId });
      const entity = createMockEntityWithQuestionsAndAnswers(task);

      const mockTransactionRepo = {
        findOne: jest.fn().mockResolvedValueOnce(entity),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      repository.setEntityManager(mockEntityManager);
      QuizGenerationTaskMapper.toDomain = jest.fn().mockReturnValueOnce(task);

      // When
      const result = await repository.findById(taskId);

      // Then
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        QuizGenerationTaskEntity,
      );
      expect(mockTransactionRepo.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['questions', 'questions.answers'],
      });
      expect(QuizGenerationTaskMapper.toDomain).toHaveBeenCalledWith(entity);
      expect(result).toBe(task);
      expect(typeOrmRepository.findOne).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Given
      const taskId = faker.string.uuid();
      const dbError = new Error('Database error');
      typeOrmRepository.findOne.mockRejectedValueOnce(dbError);

      // When & Then
      await expect(repository.findById(taskId)).rejects.toThrow(dbError);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['questions', 'questions.answers'],
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

  describe('findByUserId', () => {
    it('should return tasks for a specific user', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const tasks = [createMockTask({ userId }), createMockTask({ userId })];
      const entities = tasks.map((task) => createMockEntity(task));

      typeOrmRepository.find.mockResolvedValueOnce(entities);
      QuizGenerationTaskMapper.toDomainList = jest
        .fn()
        .mockReturnValueOnce(tasks);

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['questions'],
        order: { createdAt: 'DESC' },
      });
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith(
        entities,
      );
      expect(result).toBe(tasks);
    });

    it('should return empty array when no tasks are found for user', async () => {
      // Arrange
      const userId = faker.string.uuid();
      typeOrmRepository.find.mockResolvedValueOnce([]);
      QuizGenerationTaskMapper.toDomainList = jest.fn().mockReturnValueOnce([]);

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(result).toEqual([]);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['questions'],
        order: { createdAt: 'DESC' },
      });
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith([]);
    });

    it('should use stored entity manager when available', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const tasks = [createMockTask({ userId }), createMockTask({ userId })];
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
      const result = await repository.findByUserId(userId);

      // Assert
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        QuizGenerationTaskEntity,
      );
      expect(mockTransactionRepo.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['questions'],
        order: { createdAt: 'DESC' },
      });
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith(
        entities,
      );
      expect(result).toBe(tasks);
      expect(typeOrmRepository.find).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const dbError = new Error('Database error');
      typeOrmRepository.find.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.findByUserId(userId)).rejects.toThrow(dbError);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['questions'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByUserIdPaginated', () => {
    it('should retrieve a page of tasks for a specific user', async () => {
      // Given
      const userId = faker.string.uuid();
      const pageSize = 10;
      const pageNumber = 2;
      const totalItems = 25;

      const tasks = Array(pageSize)
        .fill(null)
        .map(() => createMockTask({ userId }));
      const entities = tasks.map((task) => createMockEntity(task));

      typeOrmRepository.count.mockResolvedValueOnce(totalItems);
      typeOrmRepository.find.mockResolvedValueOnce(entities);
      QuizGenerationTaskMapper.toDomainList = jest
        .fn()
        .mockReturnValueOnce(tasks);

      // When
      const result = await repository.findByUserIdPaginated(userId, {
        page: pageNumber,
        limit: pageSize,
      });

      // Then
      expect(result.data).toEqual(tasks);
      expect(result.meta).toEqual({
        page: pageNumber,
        limit: pageSize,
        totalItems,
        totalPages: 3, // Calculated as Math.ceil(25/10)
      });
    });

    it('should handle the case when a user has no tasks', async () => {
      // Given
      const userId = faker.string.uuid();
      typeOrmRepository.count.mockResolvedValueOnce(0);
      typeOrmRepository.find.mockResolvedValueOnce([]);
      QuizGenerationTaskMapper.toDomainList = jest.fn().mockReturnValueOnce([]);

      // When
      const result = await repository.findByUserIdPaginated(userId, {
        page: 1,
        limit: 10,
      });

      // Then
      expect(result.data).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should return the correct items for the last page', async () => {
      // Given
      const userId = faker.string.uuid();
      const totalItems = 22;
      const pageSize = 10;
      const lastPage = 3;
      const lastPageItemCount = 2; // 22 items: page 1 has 10, page 2 has 10, page 3 has 2

      const tasks = Array(lastPageItemCount)
        .fill(null)
        .map(() => createMockTask({ userId }));
      const entities = tasks.map((task) => createMockEntity(task));

      typeOrmRepository.count.mockResolvedValueOnce(totalItems);
      typeOrmRepository.find.mockResolvedValueOnce(entities);
      QuizGenerationTaskMapper.toDomainList = jest
        .fn()
        .mockReturnValueOnce(tasks);

      // When
      const result = await repository.findByUserIdPaginated(userId, {
        page: lastPage,
        limit: pageSize,
      });

      // Then
      expect(result.data.length).toBe(lastPageItemCount);
      expect(result.meta.totalPages).toBe(3);
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
