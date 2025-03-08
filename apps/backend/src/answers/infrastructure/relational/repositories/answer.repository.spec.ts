import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Answer } from '@flash-me/core/entities';
import { AnswerEntity } from '../entities/answer.entity';
import { AnswerRepositoryImpl } from './answer.repository';
import { AnswerMapper } from '../mappers/answer.mapper';
import { faker } from '@faker-js/faker';

describe('AnswerRepositoryImpl', () => {
  let answerRepository: AnswerRepositoryImpl;
  let typeOrmRepository: jest.Mocked<Repository<AnswerEntity>>;

  beforeEach(async () => {
    // Create mock for the TypeORM repository
    const mockRepository = {
      save: jest.fn(),
      find: jest.fn(),
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
      const answers = [
        new Answer({
          id: faker.string.uuid(),
          content: faker.lorem.paragraph(),
          questionId: faker.string.uuid(),
          isCorrect: faker.datatype.boolean(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
        new Answer({
          id: faker.string.uuid(),
          content: faker.lorem.paragraph(),
          questionId: faker.string.uuid(),
          isCorrect: faker.datatype.boolean(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      ];

      const entities = answers.map((a) => {
        const entity = new AnswerEntity();
        entity.id = a.getId();
        entity.content = a.getContent();
        entity.questionId = a.getQuestionId();
        entity.isCorrect = a.getIsCorrect();
        entity.createdAt = a.getCreatedAt();
        entity.updatedAt = a.getUpdatedAt();
        return entity;
      });

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
      const answer = new Answer({
        id: faker.string.uuid(),
        content: faker.lorem.paragraph(),
        questionId: faker.string.uuid(),
        isCorrect: faker.datatype.boolean(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const entity = new AnswerEntity();
      entity.id = answer.getId();
      entity.content = answer.getContent();
      entity.questionId = answer.getQuestionId();
      entity.isCorrect = answer.getIsCorrect();
      entity.createdAt = answer.getCreatedAt();
      entity.updatedAt = answer.getUpdatedAt();

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
      const answer = new Answer({
        id: faker.string.uuid(),
        content: faker.lorem.paragraph(),
        questionId: faker.string.uuid(),
        isCorrect: faker.datatype.boolean(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const entity = new AnswerEntity();
      entity.id = answer.getId();
      entity.content = answer.getContent();
      entity.questionId = answer.getQuestionId();
      entity.isCorrect = answer.getIsCorrect();
      entity.createdAt = answer.getCreatedAt();
      entity.updatedAt = answer.getUpdatedAt();

      AnswerMapper.toPersistence = jest.fn().mockReturnValueOnce(entity);

      // Mock entityManager and its repository
      const mockTransactionRepo = {
        save: jest.fn().mockResolvedValue([entity]),
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
});
