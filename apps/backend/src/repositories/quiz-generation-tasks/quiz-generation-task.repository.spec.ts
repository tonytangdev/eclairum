import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { QuizGenerationTaskRepositoryImpl } from './quiz-generation-task.repository';
import { QuizGenerationTaskMapper } from './mappers/quiz-generation-task.mapper';
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from '@eclairum/core/entities';
import { faker } from '@faker-js/faker';
import { UnitOfWorkService } from '../../unit-of-work/unit-of-work.service';
import { QuizGenerationTaskEntity } from '../../common/entities/quiz-generation-task.entity';
import { QuestionEntity } from '../../common/entities/question.entity';
import { AnswerEntity } from '../../common/entities/answer.entity';

describe('QuizGenerationTaskRepositoryImpl', () => {
  let repository: QuizGenerationTaskRepositoryImpl;
  let mockRepository: jest.Mocked<Repository<QuizGenerationTaskEntity>>;
  let mockUnitOfWorkService: jest.Mocked<UnitOfWorkService>;

  // Helper functions to create test data
  const createMockTask = (overrides = {}): QuizGenerationTask =>
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

  const createMockEntity = (
    task: QuizGenerationTask,
  ): QuizGenerationTaskEntity => {
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

  const createMockEntityWithQuestionsAndAnswers = (
    task: QuizGenerationTask,
  ): QuizGenerationTaskEntity => {
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
    // Create mock repository
    mockRepository = {
      save: jest.fn().mockResolvedValue({}),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    } as unknown as jest.Mocked<Repository<QuizGenerationTaskEntity>>;

    // Create mock UnitOfWorkService
    mockUnitOfWorkService = {
      getManager: jest.fn().mockReturnValue({
        getRepository: jest.fn().mockReturnValue(mockRepository),
      }),
      doTransactional: jest.fn(),
    } as unknown as jest.Mocked<UnitOfWorkService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizGenerationTaskRepositoryImpl,
        {
          provide: UnitOfWorkService,
          useValue: mockUnitOfWorkService,
        },
      ],
    }).compile();

    repository = module.get<QuizGenerationTaskRepositoryImpl>(
      QuizGenerationTaskRepositoryImpl,
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
      const entity = createMockEntity(task);
      QuizGenerationTaskMapper.toEntity = jest.fn().mockReturnValueOnce(entity);

      // Mock the repository save method with proper typing
      mockRepository.save.mockImplementation(() =>
        Promise.resolve(entity as any),
      );

      // Act
      await repository.saveTask(task);

      // Assert
      expect(QuizGenerationTaskMapper.toEntity).toHaveBeenCalledWith(task);
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
    });
  });

  describe('save', () => {
    it('should persist the task and return it', async () => {
      // Arrange
      const task = createMockTask();
      const entity = createMockEntity(task);
      QuizGenerationTaskMapper.toEntity = jest.fn().mockReturnValueOnce(entity);

      // Fix the type issue with mockResolvedValue
      mockRepository.save.mockImplementation(() =>
        Promise.resolve(entity as any),
      );

      // Act
      const result = await repository.save(task);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(QuizGenerationTaskMapper.toEntity).toHaveBeenCalledWith(task);
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(task);
    });

    it('should propagate errors from the database', async () => {
      // Arrange
      const task = createMockTask();
      const entity = createMockEntity(task);
      const dbError = new Error('Database error');

      QuizGenerationTaskMapper.toEntity = jest.fn().mockReturnValueOnce(entity);
      mockRepository.save.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.save(task)).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(QuizGenerationTaskMapper.toEntity).toHaveBeenCalledWith(task);
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
    });
  });

  describe('findById', () => {
    it('should return the task when found with its questions and answers', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const task = createMockTask({ id: taskId });
      const entity = createMockEntityWithQuestionsAndAnswers(task);

      mockRepository.findOne.mockResolvedValueOnce(entity);
      QuizGenerationTaskMapper.toDomain = jest.fn().mockReturnValueOnce(task);

      // Act
      const result = await repository.findById(taskId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['questions', 'questions.answers'],
      });
      expect(QuizGenerationTaskMapper.toDomain).toHaveBeenCalledWith(entity);
      expect(result).toBe(task);
    });

    it('should return null when no task is found', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      mockRepository.findOne.mockResolvedValueOnce(null);

      // Act
      const result = await repository.findById(taskId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['questions', 'questions.answers'],
      });
      expect(QuizGenerationTaskMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should propagate database errors', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const dbError = new Error('Database error during findOne');
      mockRepository.findOne.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.findById(taskId)).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['questions', 'questions.answers'],
      });
    });
  });

  describe('findByUserId', () => {
    it('should return all tasks for the specified user', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const tasks = [createMockTask({ userId }), createMockTask({ userId })];
      const entities = tasks.map((task) => createMockEntity(task));

      mockRepository.find.mockResolvedValueOnce(entities);
      QuizGenerationTaskMapper.toDomainList = jest
        .fn()
        .mockReturnValueOnce(tasks);

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['questions'],
        order: { createdAt: 'DESC' },
      });
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith(
        entities,
      );
      expect(result).toBe(tasks);
    });

    it('should return empty array when user has no tasks', async () => {
      // Arrange
      const userId = faker.string.uuid();
      mockRepository.find.mockResolvedValueOnce([]);
      QuizGenerationTaskMapper.toDomainList = jest.fn().mockReturnValueOnce([]);

      // Act
      const result = await repository.findByUserId(userId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['questions'],
        order: { createdAt: 'DESC' },
      });
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it('should propagate database errors', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const dbError = new Error('Database error during find');
      mockRepository.find.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.findByUserId(userId)).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['questions'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByUserIdPaginated', () => {
    it('should return paginated tasks with correct metadata', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const page = 2;
      const limit = 10;
      const totalItems = 25;
      const expectedTotalPages = 3;

      const tasks = Array(limit)
        .fill(null)
        .map(() => createMockTask({ userId }));
      const entities = tasks.map((task) => createMockEntity(task));

      mockRepository.count.mockResolvedValueOnce(totalItems);
      mockRepository.find.mockResolvedValueOnce(entities);
      QuizGenerationTaskMapper.toDomainList = jest
        .fn()
        .mockReturnValueOnce(tasks);

      // Act
      const result = await repository.findByUserIdPaginated(userId, {
        page,
        limit,
      });

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.count).toHaveBeenCalledWith({ where: { userId } });
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['questions'],
        order: { createdAt: 'DESC' },
        skip: 10, // (page - 1) * limit
        take: limit,
      });
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith(
        entities,
      );
      expect(result).toEqual({
        data: tasks,
        meta: {
          page,
          limit,
          totalItems,
          totalPages: expectedTotalPages,
        },
      });
    });

    it('should handle empty results correctly', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const page = 1;
      const limit = 10;

      mockRepository.count.mockResolvedValueOnce(0);
      mockRepository.find.mockResolvedValueOnce([]);
      QuizGenerationTaskMapper.toDomainList = jest.fn().mockReturnValueOnce([]);

      // Act
      const result = await repository.findByUserIdPaginated(userId, {
        page,
        limit,
      });

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(result).toEqual({
        data: [],
        meta: {
          page,
          limit,
          totalItems: 0,
          totalPages: 0,
        },
      });
    });

    it('should handle partial page correctly', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const page = 3;
      const limit = 10;
      const totalItems = 25;
      const lastPageItemCount = 5; // 25 items: page 1 has 10, page 2 has 10, page 3 has 5

      const tasks = Array(lastPageItemCount)
        .fill(null)
        .map(() => createMockTask({ userId }));
      const entities = tasks.map((task) => createMockEntity(task));

      mockRepository.count.mockResolvedValueOnce(totalItems);
      mockRepository.find.mockResolvedValueOnce(entities);
      QuizGenerationTaskMapper.toDomainList = jest
        .fn()
        .mockReturnValueOnce(tasks);

      // Act
      const result = await repository.findByUserIdPaginated(userId, {
        page,
        limit,
      });

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(result.data.length).toBe(lastPageItemCount);
      expect(result.meta.totalPages).toBe(3);
    });

    it('should propagate database errors from count', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const dbError = new Error('Database error during count');
      mockRepository.count.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(
        repository.findByUserIdPaginated(userId, { page: 1, limit: 10 }),
      ).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.count).toHaveBeenCalledWith({ where: { userId } });
    });

    it('should propagate database errors from find', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const dbError = new Error('Database error during find');
      mockRepository.count.mockResolvedValueOnce(25);
      mockRepository.find.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(
        repository.findByUserIdPaginated(userId, { page: 1, limit: 10 }),
      ).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.count).toHaveBeenCalledWith({ where: { userId } });
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      // Arrange
      const tasks = [createMockTask(), createMockTask()];
      const entities = tasks.map((task) => createMockEntity(task));

      mockRepository.find.mockResolvedValueOnce(entities);
      QuizGenerationTaskMapper.toDomainList = jest
        .fn()
        .mockReturnValueOnce(tasks);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['questions'],
      });
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith(
        entities,
      );
      expect(result).toBe(tasks);
    });

    it('should return empty array when no tasks exist', async () => {
      // Arrange
      mockRepository.find.mockResolvedValueOnce([]);
      QuizGenerationTaskMapper.toDomainList = jest.fn().mockReturnValueOnce([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['questions'],
      });
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it('should propagate database errors', async () => {
      // Arrange
      const dbError = new Error('Database error during find all');
      mockRepository.find.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.findAll()).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['questions'],
      });
    });
  });

  describe('findByUserIdAndStatuses', () => {
    it('should return only tasks that match the specified user ID and statuses', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const statuses = [
        QuizGenerationStatus.PENDING,
        QuizGenerationStatus.IN_PROGRESS,
      ];

      const pendingTask = createMockTask({
        userId,
        status: QuizGenerationStatus.PENDING,
      });

      const inProgressTask = createMockTask({
        userId,
        status: QuizGenerationStatus.IN_PROGRESS,
      });

      const tasks = [pendingTask, inProgressTask];
      const entities = tasks.map((task) => createMockEntity(task));

      mockRepository.find.mockResolvedValueOnce(entities);
      QuizGenerationTaskMapper.toDomainList = jest
        .fn()
        .mockReturnValueOnce(tasks);

      // Act
      const result = await repository.findByUserIdAndStatuses(userId, statuses);

      // Assert
      expect(result).toBe(tasks);
      expect(result.length).toBe(2);
    });

    it('should return all user tasks when status list is empty', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const statuses: QuizGenerationStatus[] = [];

      const allUserTasks = [
        createMockTask({ userId, status: QuizGenerationStatus.PENDING }),
        createMockTask({ userId, status: QuizGenerationStatus.COMPLETED }),
      ];

      const entities = allUserTasks.map((task) => createMockEntity(task));

      mockRepository.find.mockResolvedValueOnce(entities);
      QuizGenerationTaskMapper.toDomainList = jest
        .fn()
        .mockReturnValueOnce(allUserTasks);

      // Act
      const result = await repository.findByUserIdAndStatuses(userId, statuses);

      // Assert
      expect(result).toBe(allUserTasks);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no tasks match the criteria', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const statuses = [QuizGenerationStatus.PENDING];

      mockRepository.find.mockResolvedValueOnce([]);
      QuizGenerationTaskMapper.toDomainList = jest.fn().mockReturnValueOnce([]);

      // Act
      const result = await repository.findByUserIdAndStatuses(userId, statuses);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return tasks with all requested statuses', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const statuses = [
        QuizGenerationStatus.PENDING,
        QuizGenerationStatus.IN_PROGRESS,
        QuizGenerationStatus.FAILED,
      ];

      const tasks = [
        createMockTask({ userId, status: QuizGenerationStatus.PENDING }),
        createMockTask({ userId, status: QuizGenerationStatus.IN_PROGRESS }),
        createMockTask({ userId, status: QuizGenerationStatus.FAILED }),
      ];

      const entities = tasks.map((task) => createMockEntity(task));

      mockRepository.find.mockResolvedValueOnce(entities);
      QuizGenerationTaskMapper.toDomainList = jest
        .fn()
        .mockReturnValueOnce(tasks);

      // Act
      const result = await repository.findByUserIdAndStatuses(userId, statuses);

      // Assert
      expect(result.length).toBe(3);
      // Verify we have tasks with each of the requested statuses
      const resultStatuses = result.map((task) => task.getStatus());
      expect(resultStatuses).toContain(QuizGenerationStatus.PENDING);
      expect(resultStatuses).toContain(QuizGenerationStatus.IN_PROGRESS);
      expect(resultStatuses).toContain(QuizGenerationStatus.FAILED);
    });

    it('should fail when database operation fails', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const statuses = [QuizGenerationStatus.PENDING];
      const dbError = new Error('Database error during find');
      mockRepository.find.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(
        repository.findByUserIdAndStatuses(userId, statuses),
      ).rejects.toThrow(dbError);
    });
  });

  describe('softDelete', () => {
    it('should update the deletedAt field for the specified task', async () => {
      // Arrange
      const taskId = faker.string.uuid();

      // Act
      await repository.softDelete(taskId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: taskId },
        { deletedAt: expect.any(Date) as Date },
      );
    });

    it('should handle cases where the task does not exist', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      mockRepository.update.mockResolvedValueOnce({
        affected: 0,
      } as unknown as ReturnType<
        Repository<QuizGenerationTaskEntity>['update']
      >);

      // Act
      await repository.softDelete(taskId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: taskId },
        { deletedAt: expect.any(Date) as Date },
      );
      // No error should be thrown
    });

    it('should propagate database errors', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const dbError = new Error('Database error during update');
      mockRepository.update.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(repository.softDelete(taskId)).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: taskId },
        { deletedAt: expect.any(Date) as Date },
      );
    });
  });
});
