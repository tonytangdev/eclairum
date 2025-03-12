import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Question } from '@flash-me/core/entities';
import { QuestionEntity } from '../entities/question.entity';
import { QuestionRepositoryImpl } from './question.repository';
import { QuestionMapper } from '../mappers/question.mapper';
import { faker } from '@faker-js/faker';

describe('QuestionRepositoryImpl', () => {
  let questionRepository: QuestionRepositoryImpl;
  let typeOrmRepository: jest.Mocked<Repository<QuestionEntity>>;

  // Helper functions to create test data
  const createMockQuestion = (overrides = {}) =>
    new Question({
      id: faker.string.uuid(),
      content: faker.lorem.paragraph(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      answers: [],
      ...overrides,
    });

  const createMockEntity = (question: Question) => {
    const entity = new QuestionEntity();
    entity.id = question.getId();
    entity.content = question.getContent();
    entity.createdAt = question.getCreatedAt();
    entity.updatedAt = question.getUpdatedAt();
    entity.deletedAt = question.getDeletedAt();
    return entity;
  };

  beforeEach(async () => {
    // Create mock for the TypeORM repository
    const mockRepository = {
      save: jest.fn().mockReturnValue(Promise.resolve([])),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionRepositoryImpl,
        {
          provide: getRepositoryToken(QuestionEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    questionRepository = module.get<QuestionRepositoryImpl>(
      QuestionRepositoryImpl,
    );
    typeOrmRepository = module.get(getRepositoryToken(QuestionEntity));

    // Spy on QuestionMapper to verify it's being used correctly
    jest.spyOn(QuestionMapper, 'toPersistence');
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

      // @ts-expect-error - Mocking a private method
      typeOrmRepository.save.mockResolvedValue(entities);

      // Act
      await questionRepository.saveQuestions(questions);

      // Assert
      expect(QuestionMapper.toPersistence).toHaveBeenCalledTimes(2);
      expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(questions[0]);
      expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(questions[1]);
      expect(typeOrmRepository.save).toHaveBeenCalledTimes(1);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(entities);
    });

    it('should not call save when the questions array is empty', async () => {
      // Arrange
      const emptyQuestions: Question[] = [];

      // Act
      await questionRepository.saveQuestions(emptyQuestions);

      // Assert
      expect(QuestionMapper.toPersistence).not.toHaveBeenCalled();
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      const question = createMockQuestion();
      const entity = createMockEntity(question);

      QuestionMapper.toPersistence = jest.fn().mockReturnValueOnce(entity);
      const dbError = new Error('Database connection error');
      typeOrmRepository.save.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(
        questionRepository.saveQuestions([question]),
      ).rejects.toThrow(dbError);
      expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(question);
      expect(typeOrmRepository.save).toHaveBeenCalledWith([entity]);
    });

    it('should use provided entity manager when available', async () => {
      // Arrange
      const question = createMockQuestion();
      const entity = createMockEntity(question);

      QuestionMapper.toPersistence = jest.fn().mockReturnValueOnce(entity);

      // Mock entityManager and its repository
      const mockTransactionRepo = {
        save: jest.fn().mockReturnValue(Promise.resolve([entity])),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      // Act
      await questionRepository.saveQuestions([question], mockEntityManager);

      // Assert
      expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(question);
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        QuestionEntity,
      );
      expect(mockTransactionRepo.save).toHaveBeenCalledWith([entity]);
      // Verify default repository was not used
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('setEntityManager', () => {
    it('should store the entity manager for future use', async () => {
      // Arrange
      const question = createMockQuestion();
      const entity = createMockEntity(question);

      QuestionMapper.toPersistence = jest.fn().mockReturnValue(entity);

      const mockTransactionRepo = {
        save: jest.fn().mockReturnValue(Promise.resolve([entity])),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      // Act
      questionRepository.setEntityManager(mockEntityManager);
      await questionRepository.saveQuestions([question]);

      // Assert
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        QuestionEntity,
      );
      expect(mockTransactionRepo.save).toHaveBeenCalledWith([entity]);
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });

    it('should allow overriding the stored entity manager', async () => {
      // Arrange
      const question = createMockQuestion();
      const entity = createMockEntity(question);

      QuestionMapper.toPersistence = jest.fn().mockReturnValue(entity);

      const mockRepo1 = {
        save: jest.fn().mockReturnValue(Promise.resolve([])),
      };

      const mockRepo2 = {
        save: jest.fn().mockReturnValue(Promise.resolve([entity])),
      };

      const mockEntityManager1 = {
        getRepository: jest.fn().mockReturnValue(mockRepo1),
      } as unknown as EntityManager;

      const mockEntityManager2 = {
        getRepository: jest.fn().mockReturnValue(mockRepo2),
      } as unknown as EntityManager;

      // Act
      questionRepository.setEntityManager(mockEntityManager1);
      await questionRepository.saveQuestions([question], mockEntityManager2); // Override with EM2

      // Assert
      expect(mockEntityManager2.getRepository).toHaveBeenCalledWith(
        QuestionEntity,
      );
      expect(mockRepo2.save).toHaveBeenCalledWith([entity]);
      expect(mockRepo1.save).not.toHaveBeenCalled();
    });
  });
});
