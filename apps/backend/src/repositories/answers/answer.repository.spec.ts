import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Answer } from '@eclairum/core/entities';
import { AnswerRepositoryImpl } from './answer.repository';
import { faker } from '@faker-js/faker';
import { AnswerEntity } from '../../common/entities/answer.entity';
import { UnitOfWorkService } from '../../unit-of-work/unit-of-work.service';
import { AnswerMapper } from './mappers/answer.mapper';

describe('AnswerRepositoryImpl', () => {
  let answerRepository: AnswerRepositoryImpl;
  let mockRepository: jest.Mocked<Repository<AnswerEntity>>;
  let mockUnitOfWorkService: jest.Mocked<UnitOfWorkService>;

  // Helper functions to create test data
  const createMockAnswer = (overrides = {}): Answer =>
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

  const createMockEntity = (answer: Answer): AnswerEntity => {
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
    // Create mock repository
    mockRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<AnswerEntity>>;

    // Create mock UnitOfWorkService
    mockUnitOfWorkService = {
      getManager: jest.fn().mockReturnValue({
        getRepository: jest.fn().mockReturnValue(mockRepository),
      }),
      doTransactional: jest.fn(),
    } as unknown as jest.Mocked<UnitOfWorkService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerRepositoryImpl,
        {
          provide: UnitOfWorkService,
          useValue: mockUnitOfWorkService,
        },
      ],
    }).compile();

    answerRepository = module.get<AnswerRepositoryImpl>(AnswerRepositoryImpl);

    // Spy on AnswerMapper methods
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

      mockRepository.save.mockImplementation(() =>
        Promise.resolve(entities as any),
      );

      // Act
      await answerRepository.saveAnswers(answers);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(AnswerMapper.toPersistence).toHaveBeenCalledTimes(2);
      expect(AnswerMapper.toPersistence).toHaveBeenCalledWith(answers[0]);
      expect(AnswerMapper.toPersistence).toHaveBeenCalledWith(answers[1]);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(entities);
    });

    it('should not call save when the answers array is empty', async () => {
      // Arrange
      const emptyAnswers: Answer[] = [];

      // Act
      await answerRepository.saveAnswers(emptyAnswers);

      // Assert
      expect(AnswerMapper.toPersistence).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate database errors', async () => {
      // Arrange
      const answer = createMockAnswer();
      const entity = createMockEntity(answer);
      const dbError = new Error('Database connection error');

      AnswerMapper.toPersistence = jest.fn().mockReturnValueOnce(entity);
      mockRepository.save.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(answerRepository.saveAnswers([answer])).rejects.toThrow(
        dbError,
      );
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(AnswerMapper.toPersistence).toHaveBeenCalledWith(answer);
      expect(mockRepository.save).toHaveBeenCalledWith([entity]);
    });
  });

  describe('findByQuestionId', () => {
    it('should return answers for a question id', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      const answers = [
        createMockAnswer({ questionId }),
        createMockAnswer({ questionId }),
      ];
      const entities = answers.map((a) => createMockEntity(a));

      mockRepository.find.mockResolvedValueOnce(entities);

      AnswerMapper.toDomain = jest
        .fn()
        .mockReturnValueOnce(answers[0])
        .mockReturnValueOnce(answers[1]);

      // Act
      const result = await answerRepository.findByQuestionId(questionId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { questionId },
      });
      expect(AnswerMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(answers[0]);
      expect(result[1]).toEqual(answers[1]);
    });

    it('should return empty array when no answers found', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      mockRepository.find.mockResolvedValueOnce([]);

      // Act
      const result = await answerRepository.findByQuestionId(questionId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { questionId },
      });
      expect(AnswerMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should propagate database errors', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      const dbError = new Error('Database query error');
      mockRepository.find.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(
        answerRepository.findByQuestionId(questionId),
      ).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { questionId },
      });
    });
  });

  describe('findById', () => {
    it('should return an answer when found', async () => {
      // Arrange
      const answerId = faker.string.uuid();
      const answer = createMockAnswer({ id: answerId });
      const entity = createMockEntity(answer);

      mockRepository.findOne.mockResolvedValueOnce(entity);
      AnswerMapper.toDomain = jest.fn().mockReturnValueOnce(answer);

      // Act
      const result = await answerRepository.findById(answerId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: answerId },
      });
      expect(AnswerMapper.toDomain).toHaveBeenCalledWith(entity);
      expect(result).toEqual(answer);
    });

    it('should return null when answer not found', async () => {
      // Arrange
      const answerId = faker.string.uuid();
      mockRepository.findOne.mockResolvedValueOnce(null);

      // Act
      const result = await answerRepository.findById(answerId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: answerId },
      });
      expect(AnswerMapper.toDomain).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should propagate database errors', async () => {
      // Arrange
      const answerId = faker.string.uuid();
      const dbError = new Error('Database query error');
      mockRepository.findOne.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(answerRepository.findById(answerId)).rejects.toThrow(
        dbError,
      );
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: answerId },
      });
    });
  });

  describe('softDeleteByQuestionId', () => {
    it('should update the deletedAt field for all answers of a question', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      mockRepository.update.mockResolvedValueOnce({
        affected: 3,
      } as unknown as ReturnType<Repository<AnswerEntity>['update']>);

      // Act
      await answerRepository.softDeleteByQuestionId(questionId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(
        { questionId },
        { deletedAt: expect.any(Date) as Date },
      );
    });

    it('should handle cases where no answers are found', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      mockRepository.update.mockResolvedValueOnce({
        affected: 0,
      } as unknown as ReturnType<Repository<AnswerEntity>['update']>);

      // Act
      await answerRepository.softDeleteByQuestionId(questionId);

      // Assert
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(
        { questionId },
        { deletedAt: expect.any(Date) as Date },
      );
      // No exception should be thrown
    });

    it('should propagate database errors', async () => {
      // Arrange
      const questionId = faker.string.uuid();
      const dbError = new Error('Database error during update');
      mockRepository.update.mockRejectedValueOnce(dbError);

      // Act & Assert
      await expect(
        answerRepository.softDeleteByQuestionId(questionId),
      ).rejects.toThrow(dbError);
      expect(mockUnitOfWorkService.getManager).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(
        { questionId },
        { deletedAt: expect.any(Date) as Date },
      );
    });
  });
});
