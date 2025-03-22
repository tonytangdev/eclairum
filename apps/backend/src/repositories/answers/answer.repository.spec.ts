import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from '@eclairum/core/entities';
import { AnswerRepositoryImpl } from './answer.repository';
import { faker } from '@faker-js/faker';
import { AnswerEntity } from '../../common/entities/answer.entity';
import { AnswerMapper } from './mappers/answer.mapper';

describe('AnswerRepository', () => {
  let repository: AnswerRepositoryImpl;
  let typeormRepo: jest.Mocked<Repository<AnswerEntity>>;

  /**
   * Creates a test Answer domain object
   */
  const createAnswer = (props: Partial<Answer> = {}): Answer => {
    return new Answer({
      id: faker.string.uuid(),
      content: faker.lorem.sentence(),
      questionId: faker.string.uuid(),
      isCorrect: faker.datatype.boolean(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...props,
    });
  };

  /**
   * Creates an AnswerEntity from a domain Answer
   */
  const createEntity = (answer: Answer): AnswerEntity => {
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
    // Setup mocks
    typeormRepo = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<AnswerEntity>>;

    // Setup test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerRepositoryImpl,
        {
          provide: getRepositoryToken(AnswerEntity),
          useValue: typeormRepo,
        },
      ],
    }).compile();

    repository = module.get<AnswerRepositoryImpl>(AnswerRepositoryImpl);

    // Setup mapper mocks
    jest.spyOn(AnswerMapper, 'toPersistence').mockImplementation(createEntity);
    jest.spyOn(AnswerMapper, 'toDomain').mockImplementation(
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveAnswers', () => {
    it('should persist multiple answers to the database', async () => {
      // Given some answers
      const answers = [createAnswer(), createAnswer()];
      // @ts-expect-error typeormRepo return type is not right
      typeormRepo.save.mockResolvedValueOnce(answers.map(createEntity));

      // When saving the answers
      await repository.saveAnswers(answers);

      // Then they should be mapped and saved correctly
      expect(AnswerMapper.toPersistence).toHaveBeenCalledTimes(2);
      expect(typeormRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: answers[0].getId() }),
          expect.objectContaining({ id: answers[1].getId() }),
        ]),
      );
    });

    it('should skip database operations when given an empty array', async () => {
      // Given an empty array of answers
      const emptyAnswers: Answer[] = [];

      // When saving the empty array
      await repository.saveAnswers(emptyAnswers);

      // Then no database operations should be performed
      expect(AnswerMapper.toPersistence).not.toHaveBeenCalled();
      expect(typeormRepo.save).not.toHaveBeenCalled();
    });

    it('should surface database errors to the caller', async () => {
      // Given an answer and a database error
      const answer = createAnswer();
      const dbError = new Error('Database unavailable');
      typeormRepo.save.mockRejectedValueOnce(dbError);

      // When saving the answer, it should propagate the error
      await expect(repository.saveAnswers([answer])).rejects.toThrow(
        'Database unavailable',
      );

      // And the mapping should have been attempted
      expect(AnswerMapper.toPersistence).toHaveBeenCalledWith(answer);
    });

    it('should efficiently handle bulk operations', async () => {
      // Given a large set of answers
      const manyAnswers = Array(30)
        .fill(null)
        .map(() => createAnswer());
      // @ts-expect-error typeormRepo return type is not right
      typeormRepo.save.mockResolvedValueOnce([]);

      // When saving them all
      await repository.saveAnswers(manyAnswers);

      // Then they should be saved in a single operation
      expect(typeormRepo.save).toHaveBeenCalledTimes(1);
      expect(AnswerMapper.toPersistence).toHaveBeenCalledTimes(30);
    });
  });

  describe('findByQuestionId', () => {
    it('should retrieve all answers for a specific question', async () => {
      // Given a question ID with associated answers
      const questionId = faker.string.uuid();
      const answers = [
        createAnswer({ questionId } as Partial<Answer>),
        createAnswer({ questionId } as Partial<Answer>),
      ];
      typeormRepo.find.mockResolvedValueOnce(answers.map(createEntity));

      // When finding answers by question ID
      const result = await repository.findByQuestionId(questionId);

      // Then all answers should be returned and correctly mapped
      expect(typeormRepo.find).toHaveBeenCalledWith({ where: { questionId } });
      expect(result).toHaveLength(2);
      expect(result[0].getQuestionId()).toBe(questionId);
      expect(result[1].getQuestionId()).toBe(questionId);
    });

    it('should return an empty array when no answers exist', async () => {
      // Given a question ID with no answers
      const questionId = faker.string.uuid();
      typeormRepo.find.mockResolvedValueOnce([]);

      // When finding answers by question ID
      const result = await repository.findByQuestionId(questionId);

      // Then an empty array should be returned
      expect(result).toEqual([]);
      expect(result).toBeInstanceOf(Array);
    });

    it('should properly map specific properties from entity to domain object', async () => {
      // Given an answer with specific properties
      const questionId = faker.string.uuid();
      const specificContent = 'Specific test content for verification';
      const answer = createAnswer({
        questionId,
        content: specificContent,
        isCorrect: true,
      } as Partial<Answer>);
      typeormRepo.find.mockResolvedValueOnce([createEntity(answer)]);

      // When finding answers by question ID
      const result = await repository.findByQuestionId(questionId);

      // Then the specific properties should be preserved
      expect(result[0].getContent()).toBe(specificContent);
      expect(result[0].getIsCorrect()).toBe(true);
    });

    it('should propagate database errors', async () => {
      // Given a database error
      const questionId = faker.string.uuid();
      const dbError = new Error('Connection failed');
      typeormRepo.find.mockRejectedValueOnce(dbError);

      // When finding answers, it should propagate the error
      await expect(repository.findByQuestionId(questionId)).rejects.toThrow(
        'Connection failed',
      );
    });
  });

  describe('findById', () => {
    it('should retrieve a single answer by its ID', async () => {
      // Given an answer in the database
      const answerId = faker.string.uuid();
      const answer = createAnswer({ id: answerId } as Partial<Answer>);
      typeormRepo.findOne.mockResolvedValueOnce(createEntity(answer));

      // When finding by ID
      const result = await repository.findById(answerId);

      // Then the answer should be returned
      expect(typeormRepo.findOne).toHaveBeenCalledWith({
        where: { id: answerId },
      });
      expect(result).not.toBeNull();
      expect(result?.getId()).toBe(answerId);
    });

    it('should return null when no answer matches the ID', async () => {
      // Given a non-existent answer ID
      const nonExistentId = faker.string.uuid();
      typeormRepo.findOne.mockResolvedValueOnce(null);

      // When finding by ID
      const result = await repository.findById(nonExistentId);

      // Then null should be returned
      expect(result).toBeNull();
    });

    it('should preserve all entity properties when mapping to domain object', async () => {
      // Given an entity with specific values for all properties
      const answerId = faker.string.uuid();
      const questionId = faker.string.uuid();
      const createdAt = new Date('2023-01-15');
      const updatedAt = new Date('2023-01-16');

      const entity = new AnswerEntity();
      entity.id = answerId;
      entity.content = 'Complete property test';
      entity.questionId = questionId;
      entity.isCorrect = true;
      entity.createdAt = createdAt;
      entity.updatedAt = updatedAt;
      entity.deletedAt = null;

      typeormRepo.findOne.mockResolvedValueOnce(entity);

      // When finding by ID
      const result = await repository.findById(answerId);

      // Then all properties should be preserved
      expect(result?.getId()).toBe(answerId);
      expect(result?.getContent()).toBe('Complete property test');
      expect(result?.getQuestionId()).toBe(questionId);
      expect(result?.getIsCorrect()).toBe(true);
      expect(result?.getCreatedAt()).toEqual(createdAt);
      expect(result?.getUpdatedAt()).toEqual(updatedAt);
      expect(result?.getDeletedAt()).toBeNull();
    });
  });

  describe('softDeleteByQuestionId', () => {
    it('should mark all answers for a question as deleted', async () => {
      // Given a question with answers
      const questionId = faker.string.uuid();
      const beforeTest = new Date();

      typeormRepo.update.mockResolvedValueOnce({
        affected: 3,
        raw: {},
        generatedMaps: [],
      });

      // When soft deleting by question ID
      await repository.softDeleteByQuestionId(questionId);

      // Then all matching answers should be updated with a deletedAt timestamp
      expect(typeormRepo.update).toHaveBeenCalledWith(
        { questionId },
        { deletedAt: expect.any(Date) as Date },
      );

      // And the timestamp should be recent
      const updateData = typeormRepo.update.mock.calls[0][1] as {
        deletedAt: Date;
      };
      expect(updateData.deletedAt.getTime()).toBeGreaterThanOrEqual(
        beforeTest.getTime(),
      );
      expect(updateData.deletedAt.getTime()).toBeLessThanOrEqual(
        new Date().getTime(),
      );
    });

    it('should succeed even when no answers match the question ID', async () => {
      // Given a question with no answers
      const questionId = faker.string.uuid();
      typeormRepo.update.mockResolvedValueOnce({
        affected: 0,
        raw: {},
        generatedMaps: [],
      });

      // When soft deleting by question ID
      // Then no exception should be thrown
      await expect(
        repository.softDeleteByQuestionId(questionId),
      ).resolves.not.toThrow();
    });

    it('should perform a soft delete rather than a hard delete', async () => {
      // Given a question ID
      const questionId = faker.string.uuid();

      // When soft deleting by question ID
      await repository.softDeleteByQuestionId(questionId);

      // Then update should be used (not delete)
      expect(typeormRepo.update).toHaveBeenCalled();
      expect(typeormRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('Mapper integration', () => {
    it('should correctly map domain objects to database entities', async () => {
      // Given an answer with specific properties
      const answer = createAnswer({
        content: 'Mapper integration test',
        isCorrect: true,
      } as Partial<Answer>);

      // Reset the mock to test actual mapping
      jest.spyOn(AnswerMapper, 'toPersistence').mockRestore();
      const mapperSpy = jest.spyOn(AnswerMapper, 'toPersistence');

      // When the answer is saved
      await repository.saveAnswers([answer]);

      // Then the mapper should be called with the domain object
      expect(mapperSpy).toHaveBeenCalledWith(answer);
    });

    it('should correctly map database entities to domain objects', async () => {
      // Given an entity in the database
      const entity = new AnswerEntity();
      entity.id = faker.string.uuid();
      entity.content = 'Entity to domain test';
      entity.questionId = faker.string.uuid();
      entity.isCorrect = true;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();
      entity.deletedAt = null;

      typeormRepo.findOne.mockResolvedValueOnce(entity);

      // Reset the mock to test actual mapping
      jest.spyOn(AnswerMapper, 'toDomain').mockRestore();
      const mapperSpy = jest.spyOn(AnswerMapper, 'toDomain');

      // When the entity is retrieved
      await repository.findById(entity.id);

      // Then the mapper should be called with the entity
      expect(mapperSpy).toHaveBeenCalledWith(entity);
    });
  });

  describe('save', () => {
    it('should persist a single answer to the database', async () => {
      // Given an answer
      const answer = createAnswer();

      typeormRepo.save.mockResolvedValueOnce(createEntity(answer));

      // When saving the answer
      await repository.save(answer);

      // Then it should be mapped and saved correctly
      expect(AnswerMapper.toPersistence).toHaveBeenCalledWith(answer);
      expect(typeormRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: answer.getId() }),
      );
    });

    it('should surface database errors to the caller', async () => {
      // Given an answer and a database error
      const answer = createAnswer();
      const dbError = new Error('Database unavailable');
      typeormRepo.save.mockRejectedValueOnce(dbError);

      // When saving the answer, it should propagate the error
      await expect(repository.save(answer)).rejects.toThrow(
        'Database unavailable',
      );

      // And the mapping should have been attempted
      expect(AnswerMapper.toPersistence).toHaveBeenCalledWith(answer);
    });
  });
});
