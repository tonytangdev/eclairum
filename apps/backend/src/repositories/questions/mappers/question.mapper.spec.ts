import { Answer, Question } from '@eclairum/core/entities';
import { QuestionMapper } from './question.mapper';
import { faker } from '@faker-js/faker';
import { QuestionEntity } from '../../../common/entities/question.entity';
import { AnswerEntity } from '../../../common/entities/answer.entity';
import { AnswerMapper } from '../../answers/mappers/answer.mapper';

// Mock the AnswerMapper dependency
jest.mock('../../answers/mappers/answer.mapper');

describe('QuestionMapper', () => {
  /**
   * Factory function to create a domain Answer for testing
   */
  const createAnswer = (
    props: {
      id?: string;
      content?: string;
      isCorrect?: boolean;
      questionId?: string;
    } = {},
  ): Answer => {
    const {
      id = faker.string.uuid(),
      content = faker.lorem.sentence(),
      isCorrect = faker.datatype.boolean(),
      questionId = faker.string.uuid(),
    } = props;

    return new Answer({
      id,
      content,
      isCorrect,
      questionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  /**
   * Factory function to create a domain Question for testing
   */
  const createQuestion = (
    props: {
      id?: string;
      content?: string;
      answers?: Answer[];
      taskId?: string;
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: Date | null;
    } = {},
  ): Question => {
    const {
      id = faker.string.uuid(),
      content = faker.lorem.paragraph(),
      answers = [],
      taskId = faker.string.uuid(),
      createdAt = new Date(),
      updatedAt = new Date(),
      deletedAt = null,
    } = props;

    return new Question({
      id,
      content,
      answers,
      quizGenerationTaskId: taskId,
      createdAt,
      updatedAt,
      deletedAt,
    });
  };

  /**
   * Factory function to create an AnswerEntity for testing
   */
  const createAnswerEntity = (
    props: {
      id?: string;
      content?: string;
      isCorrect?: boolean;
      questionId?: string;
    } = {},
  ): AnswerEntity => {
    const {
      id = faker.string.uuid(),
      content = faker.lorem.sentence(),
      isCorrect = faker.datatype.boolean(),
      questionId = faker.string.uuid(),
    } = props;

    const entity = new AnswerEntity();
    entity.id = id;
    entity.content = content;
    entity.isCorrect = isCorrect;
    entity.questionId = questionId;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.deletedAt = null;

    return entity;
  };

  /**
   * Factory function to create a QuestionEntity for testing
   */
  const createQuestionEntity = (
    props: {
      id?: string;
      content?: string;
      taskId?: string;
      answers?: AnswerEntity[];
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: Date | null;
    } = {},
  ): QuestionEntity => {
    const {
      id = faker.string.uuid(),
      content = faker.lorem.paragraph(),
      taskId = faker.string.uuid(),
      answers = [],
      createdAt = new Date(),
      updatedAt = new Date(),
      deletedAt = null,
    } = props;

    const entity = new QuestionEntity();
    entity.id = id;
    entity.content = content;
    entity.quizGenerationTaskId = taskId;
    entity.answers = answers;
    entity.createdAt = createdAt;
    entity.updatedAt = updatedAt;
    entity.deletedAt = deletedAt;

    return entity;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toPersistence', () => {
    it('should map a domain Question to a QuestionEntity with all properties preserved', () => {
      // Given a domain Question with specific properties
      const testId = faker.string.uuid();
      const testContent = faker.lorem.paragraph();
      const testTaskId = faker.string.uuid();
      const testDate = new Date('2023-05-15');
      const question = createQuestion({
        id: testId,
        content: testContent,
        taskId: testTaskId,
        createdAt: testDate,
        updatedAt: testDate,
      });

      // When mapping to a persistence entity
      const entity = QuestionMapper.toPersistence(question);

      // Then all properties should be correctly mapped
      expect(entity).toBeInstanceOf(QuestionEntity);
      expect(entity.id).toBe(testId);
      expect(entity.content).toBe(testContent);
      expect(entity.quizGenerationTaskId).toBe(testTaskId);
      expect(entity.createdAt).toBe(testDate);
      expect(entity.updatedAt).toBe(testDate);
      expect(entity.deletedAt).toBeNull();
    });

    it('should correctly handle a deleted Question', () => {
      // Given a deleted domain Question
      const deletedDate = new Date('2023-06-01');
      const question = createQuestion({
        deletedAt: deletedDate,
      });

      // When mapping to a persistence entity
      const entity = QuestionMapper.toPersistence(question);

      // Then the deletedAt property should be preserved
      expect(entity.deletedAt).toBe(deletedDate);
    });

    it('should map only the base Question properties without answers', () => {
      // Given a Question with answers
      const questionId = faker.string.uuid();
      const answers = [
        createAnswer({ questionId }),
        createAnswer({ questionId }),
      ];
      const question = createQuestion({
        id: questionId,
        answers,
      });

      // When mapping to a persistence entity
      const entity = QuestionMapper.toPersistence(question);

      // Then the answers should not be included in the mapping
      expect(entity.answers).toBeUndefined();
    });
  });

  describe('toDomain', () => {
    it('should map a QuestionEntity to a domain Question with all properties preserved', () => {
      // Given a QuestionEntity with specific properties
      const testId = faker.string.uuid();
      const testContent = faker.lorem.paragraph();
      const testTaskId = faker.string.uuid();
      const testDate = new Date('2023-05-15');
      const entity = createQuestionEntity({
        id: testId,
        content: testContent,
        taskId: testTaskId,
        createdAt: testDate,
        updatedAt: testDate,
      });

      // When mapping to a domain model
      const question = QuestionMapper.toDomain(entity);

      // Then all properties should be correctly mapped
      expect(question).toBeInstanceOf(Question);
      expect(question.getId()).toBe(testId);
      expect(question.getContent()).toBe(testContent);
      expect(question.getQuizGenerationTaskId()).toBe(testTaskId);
      expect(question.getCreatedAt()).toBe(testDate);
      expect(question.getUpdatedAt()).toBe(testDate);
      expect(question.getDeletedAt()).toBeNull();
    });

    it('should correctly handle a deleted QuestionEntity', () => {
      // Given a deleted QuestionEntity
      const deletedDate = new Date('2023-06-01');
      const entity = createQuestionEntity({
        deletedAt: deletedDate,
      });

      // When mapping to a domain model
      const question = QuestionMapper.toDomain(entity);

      // Then the deletedAt property should be preserved
      expect(question.getDeletedAt()).toBe(deletedDate);
    });

    it('should initialize answers as an empty array when entity has no answers', () => {
      // Given a QuestionEntity without answers
      const entity = createQuestionEntity({
        answers: undefined,
      });

      // When mapping to a domain model
      const question = QuestionMapper.toDomain(entity);

      // Then the answers should be an empty array
      expect(question.getAnswers()).toEqual([]);
      expect(question.getAnswers()).toHaveLength(0);
    });

    it('should map associated answer entities to domain answer objects', () => {
      // Given a QuestionEntity with answer entities
      const questionId = faker.string.uuid();
      const answerEntities = [
        createAnswerEntity({ questionId }),
        createAnswerEntity({ questionId }),
      ];

      const mockAnswers = [
        createAnswer({ questionId }),
        createAnswer({ questionId }),
      ];

      // Mock the AnswerMapper to return specific answers
      (AnswerMapper.toDomain as jest.Mock)
        .mockReturnValueOnce(mockAnswers[0])
        .mockReturnValueOnce(mockAnswers[1]);

      const entity = createQuestionEntity({
        id: questionId,
        answers: answerEntities,
      });

      // When mapping to a domain model
      const question = QuestionMapper.toDomain(entity);

      // Then the answers should be correctly mapped
      expect(AnswerMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(AnswerMapper.toDomain).toHaveBeenCalledWith(answerEntities[0]);
      expect(AnswerMapper.toDomain).toHaveBeenCalledWith(answerEntities[1]);

      expect(question.getAnswers()).toHaveLength(2);
      expect(question.getAnswers()[0]).toBe(mockAnswers[0]);
      expect(question.getAnswers()[1]).toBe(mockAnswers[1]);
    });
  });

  describe('Mapper behavior', () => {
    it('should handle bidirectional mapping (domain → entity → domain) correctly', () => {
      // Given a domain Question with specific properties
      const originalQuestion = createQuestion({
        content: 'Original question content',
        taskId: 'task-123',
      });

      // When mapping domain → entity → domain
      const entity = QuestionMapper.toPersistence(originalQuestion);

      // Mock AnswerMapper for the second conversion
      (AnswerMapper.toDomain as jest.Mock).mockImplementation(() => {
        return createAnswer({ questionId: originalQuestion.getId() });
      });

      // Add answers to simulate the complete entity that would come from the database
      entity.answers = [createAnswerEntity({ questionId: entity.id })];

      const resultQuestion = QuestionMapper.toDomain(entity);

      // Then the core properties should be preserved
      expect(resultQuestion.getId()).toBe(originalQuestion.getId());
      expect(resultQuestion.getContent()).toBe(originalQuestion.getContent());
      expect(resultQuestion.getQuizGenerationTaskId()).toBe(
        originalQuestion.getQuizGenerationTaskId(),
      );

      // And answers should be mapped
      expect(resultQuestion.getAnswers()).toHaveLength(1);
    });

    it('should handle null values gracefully', () => {
      // Given an entity with null values where allowed
      const entity = createQuestionEntity();
      entity.deletedAt = null;
      entity.answers = null as unknown as AnswerEntity[]; // Simulate potential DB issue

      // When mapping to a domain model
      const question = QuestionMapper.toDomain(entity);

      // Then null values should be handled appropriately
      expect(question.getDeletedAt()).toBeNull();
      expect(question.getAnswers()).toEqual([]);
    });
  });
});
