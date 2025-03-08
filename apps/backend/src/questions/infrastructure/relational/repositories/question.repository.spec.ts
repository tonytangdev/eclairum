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

  beforeEach(async () => {
    // Create mock for the TypeORM repository
    const mockRepository = {
      save: jest.fn(),
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
      const questions = [
        new Question({
          id: faker.string.uuid(),
          content: faker.lorem.paragraph(),
          answers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
        new Question({
          id: faker.string.uuid(),
          content: faker.lorem.paragraph(),
          answers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }),
      ];

      const entities = questions.map((q) => {
        const entity = new QuestionEntity();
        entity.id = q.getId();
        entity.content = q.getContent();
        entity.createdAt = q.getCreatedAt();
        entity.updatedAt = q.getUpdatedAt();
        return entity;
      });

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
      const question = new Question({
        id: faker.string.uuid(),
        content: faker.lorem.paragraph(),
        answers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const entity = new QuestionEntity();
      entity.id = question.getId();
      entity.content = question.getContent();
      entity.createdAt = question.getCreatedAt();
      entity.updatedAt = question.getUpdatedAt();

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

    it('should properly map domain objects to entities', async () => {
      // Arrange
      const question = new Question({
        id: faker.string.uuid(),
        content: faker.lorem.paragraph(),
        answers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const mockEntity = new QuestionEntity();
      jest
        .spyOn(QuestionMapper, 'toPersistence')
        .mockReturnValueOnce(mockEntity);

      // Act
      await questionRepository.saveQuestions([question]);

      // Assert
      expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(question);
      expect(typeOrmRepository.save).toHaveBeenCalledWith([mockEntity]);
    });

    it('should use provided entity manager when available', async () => {
      // Arrange
      const question = new Question({
        id: faker.string.uuid(),
        content: faker.lorem.paragraph(),
        answers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const entity = new QuestionEntity();
      entity.id = question.getId();
      entity.content = question.getContent();

      QuestionMapper.toPersistence = jest.fn().mockReturnValueOnce(entity);

      // Mock entityManager and its repository
      const mockTransactionRepo = {
        save: jest.fn().mockResolvedValue([entity]),
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
});
