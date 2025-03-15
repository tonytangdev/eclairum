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
    // Create comprehensive mock for the TypeORM repository
    const mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
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

    it('should handle database errors gracefully', async () => {
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

  describe('findById', () => {
    it('should return a question when found', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      const expectedQuestion = createMockQuestion({ id: questionId });
      const entity = createMockEntity(expectedQuestion);

      typeOrmRepository.findOne.mockResolvedValue(entity);
      jest.spyOn(QuestionMapper, 'toDomain').mockReturnValue(expectedQuestion);

      // Act
      const result = await questionRepository.findById(questionId);

      // Assert
      expect(result).toEqual(expectedQuestion);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: questionId },
      });
      expect(QuestionMapper.toDomain).toHaveBeenCalledWith(entity);
    });

    it('should return null when question not found', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      typeOrmRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await questionRepository.findById(questionId);

      // Assert
      expect(result).toBeNull();
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: questionId },
      });
      expect(QuestionMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should use provided entity manager', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      const expectedQuestion = createMockQuestion({ id: questionId });
      const entity = createMockEntity(expectedQuestion);

      const mockTransactionRepo = {
        findOne: jest.fn().mockResolvedValue(entity),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      jest.spyOn(QuestionMapper, 'toDomain').mockReturnValue(expectedQuestion);

      // Act
      const result = await questionRepository.findById(
        questionId,
        mockEntityManager,
      );

      // Assert
      expect(result).toEqual(expectedQuestion);
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        QuestionEntity,
      );
      expect(mockTransactionRepo.findOne).toHaveBeenCalledWith({
        where: { id: questionId },
      });
      expect(typeOrmRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all questions', async () => {
      // Arrange
      const questions = [createMockQuestion(), createMockQuestion()];
      const entities = questions.map((q) => createMockEntity(q));

      typeOrmRepository.find.mockResolvedValue(entities);

      // Mock the toDomain method to return the corresponding question for each entity
      jest
        .spyOn(QuestionMapper, 'toDomain')
        .mockReturnValueOnce(questions[0])
        .mockReturnValueOnce(questions[1]);

      // Act
      const result = await questionRepository.findAll();

      // Assert
      expect(result).toEqual(questions);
      expect(typeOrmRepository.find).toHaveBeenCalled();
      expect(QuestionMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(QuestionMapper.toDomain).toHaveBeenNthCalledWith(1, entities[0]);
      expect(QuestionMapper.toDomain).toHaveBeenNthCalledWith(2, entities[1]);
    });

    it('should return empty array when no questions exist', async () => {
      // Arrange
      typeOrmRepository.find.mockResolvedValue([]);

      // Act
      const result = await questionRepository.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(typeOrmRepository.find).toHaveBeenCalled();
      expect(QuestionMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should use provided entity manager', async () => {
      // Arrange
      const questions = [createMockQuestion()];
      const entities = questions.map((q) => createMockEntity(q));

      const mockTransactionRepo = {
        find: jest.fn().mockResolvedValue(entities),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      jest.spyOn(QuestionMapper, 'toDomain').mockReturnValue(questions[0]);

      // Act
      const result = await questionRepository.findAll(mockEntityManager);

      // Assert
      expect(result).toEqual(questions);
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        QuestionEntity,
      );
      expect(mockTransactionRepo.find).toHaveBeenCalled();
      expect(typeOrmRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should save a single question and return the saved question', async () => {
      // Arrange
      const question = createMockQuestion();
      const entity = createMockEntity(question);

      jest.spyOn(QuestionMapper, 'toPersistence').mockReturnValue(entity);
      typeOrmRepository.save.mockResolvedValue(entity);
      jest.spyOn(QuestionMapper, 'toDomain').mockReturnValue(question);

      // Act
      const result = await questionRepository.save(question);

      // Assert
      expect(result).toEqual(question);
      expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(question);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(entity);
      expect(QuestionMapper.toDomain).toHaveBeenCalledWith(entity);
    });

    it('should handle save errors appropriately', async () => {
      // Arrange
      const question = createMockQuestion();
      const entity = createMockEntity(question);

      jest.spyOn(QuestionMapper, 'toPersistence').mockReturnValue(entity);
      const dbError = new Error('Database save error');
      typeOrmRepository.save.mockRejectedValue(dbError);

      // Act & Assert
      await expect(questionRepository.save(question)).rejects.toThrow(dbError);
      expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(question);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(entity);
    });

    it('should use provided entity manager', async () => {
      // Arrange
      const question = createMockQuestion();
      const entity = createMockEntity(question);

      jest.spyOn(QuestionMapper, 'toPersistence').mockReturnValue(entity);

      const mockTransactionRepo = {
        save: jest.fn().mockResolvedValue(entity),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      jest.spyOn(QuestionMapper, 'toDomain').mockReturnValue(question);

      // Act
      const result = await questionRepository.save(question, mockEntityManager);

      // Assert
      expect(result).toEqual(question);
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        QuestionEntity,
      );
      expect(mockTransactionRepo.save).toHaveBeenCalledWith(entity);
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });
  });
});
