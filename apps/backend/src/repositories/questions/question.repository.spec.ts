import { Test, TestingModule } from '@nestjs/testing';
import { IsNull, Repository } from 'typeorm';
import { Question } from '@eclairum/core/entities';
import { QuestionRepositoryImpl } from './question.repository';
import { faker } from '@faker-js/faker';
import { UnitOfWorkService } from '../../unit-of-work/unit-of-work.service';
import { QuestionEntity } from '../../common/entities/question.entity';
import { QuestionMapper } from './mappers/question.mapper';

describe('QuestionRepositoryImpl', () => {
  let questionRepository: QuestionRepositoryImpl;
  let mockRepository: jest.Mocked<Repository<QuestionEntity>>;
  let mockUnitOfWorkService: jest.Mocked<UnitOfWorkService>;

  // Helper functions to create test data
  const createMockQuestion = (overrides = {}): Question =>
    new Question({
      id: faker.string.uuid(),
      content: faker.lorem.paragraph(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      answers: [],
      quizGenerationTaskId: faker.string.uuid(),
      ...overrides,
    });

  const createMockEntity = (question: Question): QuestionEntity => {
    const entity = new QuestionEntity();
    entity.id = question.getId();
    entity.content = question.getContent();
    entity.createdAt = question.getCreatedAt();
    entity.updatedAt = question.getUpdatedAt();
    entity.deletedAt = question.getDeletedAt();
    return entity;
  };

  beforeEach(async () => {
    // Create mock repository
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<QuestionEntity>>;

    // Create mock UnitOfWorkService
    mockUnitOfWorkService = {
      getManager: jest.fn().mockReturnValue({
        getRepository: jest.fn().mockReturnValue(mockRepository),
      }),
      doTransactional: jest.fn(),
    } as unknown as jest.Mocked<UnitOfWorkService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionRepositoryImpl,
        {
          provide: UnitOfWorkService,
          useValue: mockUnitOfWorkService,
        },
      ],
    }).compile();

    questionRepository = module.get<QuestionRepositoryImpl>(
      QuestionRepositoryImpl,
    );

    // Spy on QuestionMapper methods
    jest.spyOn(QuestionMapper, 'toPersistence');
    jest.spyOn(QuestionMapper, 'toDomain');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveQuestions', () => {
    it('should save multiple questions', async () => {
      // Arrange
      const questions = [createMockQuestion(), createMockQuestion()];
      const entities = questions.map((q) => createMockEntity(q));

      QuestionMapper.toPersistence = jest
        .fn()
        .mockReturnValueOnce(entities[0])
        .mockReturnValueOnce(entities[1]);

      // Fix the type issue with mockResolvedValue by using a more specific mock implementation
      mockRepository.save.mockImplementation(() =>
        Promise.resolve(entities as any),
      );

      // Act
      await questionRepository.saveQuestions(questions);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(QuestionMapper.toPersistence).toHaveBeenCalledTimes(2);
      expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(questions[0]);
      expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(questions[1]);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(entities);
    });

    it('should not call save when the questions array is empty', async () => {
      // Arrange
      const emptyQuestions: Question[] = [];

      // Act
      await questionRepository.saveQuestions(emptyQuestions);

      // Assert
      expect(QuestionMapper.toPersistence).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      // Arrange
      const question = createMockQuestion();
      const entity = createMockEntity(question);
      const dbError = new Error('Database connection error');

      QuestionMapper.toPersistence = jest.fn().mockReturnValueOnce(entity);
      mockRepository.save.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(
        questionRepository.saveQuestions([question]),
      ).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(question);
      expect(mockRepository.save).toHaveBeenCalledWith([entity]);
    });
  });

  describe('findById', () => {
    it('should return a question when found', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      const expectedQuestion = createMockQuestion({ id: questionId });
      const entity = createMockEntity(expectedQuestion);

      mockRepository.findOne.mockResolvedValueOnce(entity);
      QuestionMapper.toDomain = jest.fn().mockReturnValueOnce(expectedQuestion);

      // Act
      const result = await questionRepository.findById(questionId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(result).toEqual(expectedQuestion);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: questionId },
        relations: ['answers'],
      });
      expect(QuestionMapper.toDomain).toHaveBeenCalledWith(entity);
    });

    it('should return null when question not found', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      mockRepository.findOne.mockResolvedValueOnce(null);

      // Act
      const result = await questionRepository.findById(questionId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(result).toBeNull();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: questionId },
        relations: ['answers'],
      });
      expect(QuestionMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      const dbError = new Error('Database query error');
      mockRepository.findOne.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(questionRepository.findById(questionId)).rejects.toThrow(
        dbError,
      );
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: questionId },
        relations: ['answers'],
      });
    });
  });

  describe('findByUserId', () => {
    it('should return all questions for a user', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const questions = [createMockQuestion(), createMockQuestion()];
      const entities = questions.map((q) => createMockEntity(q));

      mockRepository.find.mockResolvedValueOnce(entities);

      // Mock the toDomain method to return the corresponding question for each entity
      QuestionMapper.toDomain = jest
        .fn()
        .mockReturnValueOnce(questions[0])
        .mockReturnValueOnce(questions[1]);

      // Act
      const result = await questionRepository.findByUserId(userId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(result).toEqual(questions);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { quizGenerationTask: { user: { id: userId } } },
        relations: ['answers'],
      });
      expect(QuestionMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(QuestionMapper.toDomain).toHaveBeenNthCalledWith(1, entities[0]);
      expect(QuestionMapper.toDomain).toHaveBeenNthCalledWith(2, entities[1]);
    });

    it('should return empty array when no questions exist for the user', async () => {
      // Arrange
      const userId = faker.string.uuid();
      mockRepository.find.mockResolvedValueOnce([]);

      // Act
      const result = await questionRepository.findByUserId(userId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { quizGenerationTask: { user: { id: userId } } },
        relations: ['answers'],
      });
      expect(QuestionMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const dbError = new Error('Database query error');
      mockRepository.find.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(questionRepository.findByUserId(userId)).rejects.toThrow(
        dbError,
      );
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { quizGenerationTask: { user: { id: userId } } },
        relations: ['answers'],
      });
    });
  });

  describe('findByQuizGenerationTaskId', () => {
    it('should return all questions for a specific task', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const questions = [createMockQuestion(), createMockQuestion()];
      const entities = questions.map((q) => createMockEntity(q));

      mockRepository.find.mockResolvedValueOnce(entities);

      // Mock the toDomain method to return the corresponding question for each entity
      QuestionMapper.toDomain = jest
        .fn()
        .mockReturnValueOnce(questions[0])
        .mockReturnValueOnce(questions[1]);

      // Act
      const result =
        await questionRepository.findByQuizGenerationTaskId(taskId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(result).toEqual(questions);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          quizGenerationTaskId: taskId,
          deletedAt: IsNull(),
        },
        relations: ['answers'],
      });
      expect(QuestionMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(QuestionMapper.toDomain).toHaveBeenNthCalledWith(1, entities[0]);
      expect(QuestionMapper.toDomain).toHaveBeenNthCalledWith(2, entities[1]);
    });

    it('should return empty array when no questions exist for the task', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      mockRepository.find.mockResolvedValueOnce([]);

      // Act
      const result =
        await questionRepository.findByQuizGenerationTaskId(taskId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          quizGenerationTaskId: taskId,
          deletedAt: IsNull(),
        },
        relations: ['answers'],
      });
      expect(QuestionMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const dbError = new Error('Database query error');
      mockRepository.find.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(
        questionRepository.findByQuizGenerationTaskId(taskId),
      ).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          quizGenerationTaskId: taskId,
          deletedAt: IsNull(),
        },
        relations: ['answers'],
      });
    });
  });

  describe('save', () => {
    it('should save a single question and return the mapped domain object', async () => {
      // Arrange
      const question = createMockQuestion();
      const entity = createMockEntity(question);

      QuestionMapper.toPersistence = jest.fn().mockReturnValueOnce(entity);
      mockRepository.save.mockImplementation(() =>
        Promise.resolve(entity as any),
      );
      QuestionMapper.toDomain = jest.fn().mockReturnValueOnce(question);

      // Act
      const result = await questionRepository.save(question);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(result).toEqual(question);
      expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(question);
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
      expect(QuestionMapper.toDomain).toHaveBeenCalledWith(entity);
    });

    it('should propagate database errors', async () => {
      // Arrange
      const question = createMockQuestion();
      const entity = createMockEntity(question);
      const dbError = new Error('Database save error');

      QuestionMapper.toPersistence = jest.fn().mockReturnValueOnce(entity);
      mockRepository.save.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(questionRepository.save(question)).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(question);
      expect(mockRepository.save).toHaveBeenCalledWith(entity);
    });
  });

  describe('softDeleteByTaskId', () => {
    it('should update the deletedAt field for all questions of a task', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      mockRepository.update.mockResolvedValueOnce({
        affected: 5,
      } as unknown as ReturnType<Repository<QuestionEntity>['update']>);

      // Act
      await questionRepository.softDeleteByTaskId(taskId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(
        { quizGenerationTaskId: taskId },
        { deletedAt: expect.any(Date) as Date },
      );
    });

    it('should handle cases where no questions are found', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      mockRepository.update.mockResolvedValueOnce({
        affected: 0,
      } as unknown as ReturnType<Repository<QuestionEntity>['update']>);

      // Act
      await questionRepository.softDeleteByTaskId(taskId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(
        { quizGenerationTaskId: taskId },
        { deletedAt: expect.any(Date) as Date },
      );
      // No exception should be thrown
    });

    it('should propagate database errors', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const dbError = new Error('Database error during update');
      mockRepository.update.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(
        questionRepository.softDeleteByTaskId(taskId),
      ).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(
        { quizGenerationTaskId: taskId },
        { deletedAt: expect.any(Date) as Date },
      );
    });
  });
});
