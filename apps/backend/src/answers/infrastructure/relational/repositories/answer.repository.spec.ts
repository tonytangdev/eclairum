import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';
import { Answer } from '@eclairum/core/entities';
import { AnswerEntity } from '../entities/answer.entity';
import { AnswerRepositoryImpl } from './answer.repository';
import { AnswerMapper } from '../mappers/answer.mapper';
import { faker } from '@faker-js/faker';

describe('AnswerRepositoryImpl', () => {
  let answerRepository: AnswerRepositoryImpl;
  let typeOrmRepository: jest.Mocked<Repository<AnswerEntity>>;

  // Helper functions to create test data
  const createMockAnswer = (overrides = {}) =>
    new Answer({
      id: faker.string.uuid(),
      content: faker.lorem.paragraph(),
      questionId: faker.string.uuid(),
      isCorrect: faker.datatype.boolean(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...overrides,
    });

  const createMockEntity = (answer: Answer) => {
    const entity = new AnswerEntity();
    entity.id = answer.getId();
    entity.content = answer.getContent();
    entity.questionId = answer.getQuestionId();
    entity.isCorrect = answer.getIsCorrect();
    entity.createdAt = answer.getCreatedAt();
    entity.updatedAt = answer.getUpdatedAt();
    entity.deletedAt = answer.getDeletedAt();
    return entity;
  };

  beforeEach(async () => {
    // Create mock for the TypeORM repository with proper return types
    const mockRepository = {
      save: jest.fn().mockReturnValue(Promise.resolve([])),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerRepositoryImpl,
        {
          provide: getRepositoryToken(AnswerEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    answerRepository = module.get<AnswerRepositoryImpl>(AnswerRepositoryImpl);
    typeOrmRepository = module.get(getRepositoryToken(AnswerEntity));

    // Spy on AnswerMapper to verify it's being used correctly
    jest.spyOn(AnswerMapper, 'toPersistence');
    jest.spyOn(AnswerMapper, 'toDomain');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveAnswers', () => {
    it('should save multiple answers', async () => {
      // Arrange
      const answers = [createMockAnswer(), createMockAnswer()];
      const entities = answers.map((a) => createMockEntity(a));

      AnswerMapper.toPersistence = jest
        .fn()
        .mockReturnValueOnce(entities[0])
        .mockReturnValueOnce(entities[1]);

      // @ts-expect-error - Mocking a private method
      typeOrmRepository.save.mockResolvedValue(entities);

      // Act
      await answerRepository.saveAnswers(answers);

      // Assert
      expect(AnswerMapper.toPersistence).toHaveBeenCalledTimes(2);
      expect(AnswerMapper.toPersistence).toHaveBeenCalledWith(answers[0]);
      expect(AnswerMapper.toPersistence).toHaveBeenCalledWith(answers[1]);
      expect(typeOrmRepository.save).toHaveBeenCalledTimes(1);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(entities);
    });

    it('should not call save when the answers array is empty', async () => {
      // Arrange
      const emptyAnswers: Answer[] = [];

      // Act
      await answerRepository.saveAnswers(emptyAnswers);

      // Assert
      expect(AnswerMapper.toPersistence).not.toHaveBeenCalled();
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      const answer = createMockAnswer();
      const entity = createMockEntity(answer);

      AnswerMapper.toPersistence = jest.fn().mockReturnValueOnce(entity);
      const dbError = new Error('Database connection error');
      typeOrmRepository.save.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(answerRepository.saveAnswers([answer])).rejects.toThrow(
        dbError,
      );
      expect(AnswerMapper.toPersistence).toHaveBeenCalledWith(answer);
      expect(typeOrmRepository.save).toHaveBeenCalledWith([entity]);
    });

    it('should use provided entity manager when available', async () => {
      // Arrange
      const answer = createMockAnswer();
      const entity = createMockEntity(answer);

      AnswerMapper.toPersistence = jest.fn().mockReturnValueOnce(entity);

      // Mock entityManager and its repository with proper typing
      const mockTransactionRepo = {
        save: jest.fn().mockReturnValue(Promise.resolve([entity])),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      // Act
      await answerRepository.saveAnswers([answer], mockEntityManager);

      // Assert
      expect(AnswerMapper.toPersistence).toHaveBeenCalledWith(answer);
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        AnswerEntity,
      );
      expect(mockTransactionRepo.save).toHaveBeenCalledWith([entity]);
      // Verify default repository was not used
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByQuestionId', () => {
    it('should return answers for a question id', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      const answerEntities = [
        Object.assign(new AnswerEntity(), {
          id: faker.string.uuid(),
          content: faker.lorem.paragraph(),
          questionId,
          isCorrect: faker.datatype.boolean(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
        Object.assign(new AnswerEntity(), {
          id: faker.string.uuid(),
          content: faker.lorem.paragraph(),
          questionId,
          isCorrect: faker.datatype.boolean(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      ];

      const domainAnswers = answerEntities.map(
        (entity) =>
          new Answer({
            id: entity.id,
            content: entity.content,
            questionId: entity.questionId,
            isCorrect: entity.isCorrect,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt,
          }),
      );

      typeOrmRepository.find.mockResolvedValue(answerEntities);
      AnswerMapper.toDomain = jest
        .fn()
        .mockReturnValueOnce(domainAnswers[0])
        .mockReturnValueOnce(domainAnswers[1]);

      // Act
      const result = await answerRepository.findByQuestionId(questionId);

      // Assert
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { questionId },
      });
      expect(AnswerMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result).toEqual(domainAnswers);
    });

    it('should return empty array when no answers found', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      typeOrmRepository.find.mockResolvedValue([]);

      // Act
      const result = await answerRepository.findByQuestionId(questionId);

      // Assert
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { questionId },
      });
      expect(AnswerMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle database errors when finding answers', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      const dbError = new Error('Database query error');
      typeOrmRepository.find.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(
        answerRepository.findByQuestionId(questionId),
      ).rejects.toThrow(dbError);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { questionId },
      });
    });
  });

  describe('setEntityManager', () => {
    it('should store the entity manager for future use', async () => {
      // Arrange
      const answer = createMockAnswer();
      const entity = createMockEntity(answer);

      AnswerMapper.toPersistence = jest.fn().mockReturnValue(entity);

      const mockTransactionRepo = {
        save: jest.fn().mockReturnValue(Promise.resolve([entity])),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      // Act
      answerRepository.setEntityManager(mockEntityManager);
      await answerRepository.saveAnswers([answer]);

      // Assert
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        AnswerEntity,
      );
      expect(mockTransactionRepo.save).toHaveBeenCalledWith([entity]);
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });

    it('should allow overriding the stored entity manager', async () => {
      // Arrange
      const answer = createMockAnswer();
      const entity = createMockEntity(answer);

      AnswerMapper.toPersistence = jest.fn().mockReturnValue(entity);

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
      answerRepository.setEntityManager(mockEntityManager1);
      await answerRepository.saveAnswers([answer], mockEntityManager2); // Override with EM2

      // Assert
      expect(mockEntityManager2.getRepository).toHaveBeenCalledWith(
        AnswerEntity,
      );
      expect(mockRepo2.save).toHaveBeenCalledWith([entity]);
      expect(mockRepo1.save).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return an answer when found', async () => {
      // Arrange
      const answerId = faker.string.uuid();
      const mockAnswer = createMockAnswer({ id: answerId });
      const mockEntity = createMockEntity(mockAnswer);

      typeOrmRepository.findOne.mockResolvedValue(mockEntity);
      AnswerMapper.toDomain = jest.fn().mockReturnValue(mockAnswer);

      // Act
      const result = await answerRepository.findById(answerId);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: answerId },
      });
      expect(AnswerMapper.toDomain).toHaveBeenCalledWith(mockEntity);
      expect(result).toEqual(mockAnswer);
    });

    it('should return null when answer not found', async () => {
      // Arrange
      const answerId = faker.string.uuid();
      typeOrmRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await answerRepository.findById(answerId);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: answerId },
      });
      expect(AnswerMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should use the stored entity manager when available', async () => {
      // Arrange
      const answerId = faker.string.uuid();
      const mockAnswer = createMockAnswer({ id: answerId });
      const mockEntity = createMockEntity(mockAnswer);

      const mockTransactionRepo = {
        findOne: jest.fn().mockResolvedValue(mockEntity),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockTransactionRepo),
      } as unknown as EntityManager;

      answerRepository.setEntityManager(mockEntityManager);
      AnswerMapper.toDomain = jest.fn().mockReturnValue(mockAnswer);

      // Act
      const result = await answerRepository.findById(answerId);

      // Assert
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(
        AnswerEntity,
      );
      expect(mockTransactionRepo.findOne).toHaveBeenCalledWith({
        where: { id: answerId },
      });
      expect(AnswerMapper.toDomain).toHaveBeenCalledWith(mockEntity);
      expect(result).toEqual(mockAnswer);
      expect(typeOrmRepository.findOne).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      const answerId = faker.string.uuid();
      const dbError = new Error('Database query error');
      typeOrmRepository.findOne.mockRejectedValue(dbError);

      // Act & Assert
      await expect(answerRepository.findById(answerId)).rejects.toThrow(
        dbError,
      );
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: answerId },
      });
    });
  });
});
