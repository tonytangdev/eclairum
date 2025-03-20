import { QuizGenerationTaskMapper } from './quiz-generation-task.mapper';
import {
  QuizGenerationTask,
  Question,
  QuizGenerationStatus,
  Answer,
} from '@eclairum/core/entities';
import { QuizGenerationTaskEntity } from '../entities/quiz-generation-task.entity';
import { QuestionEntity } from '../../../../questions/infrastructure/relational/entities/question.entity';
import { AnswerEntity } from '../../../../answers/infrastructure/relational/entities/answer.entity';
import { faker } from '@faker-js/faker';
import { QuestionMapper } from '../../../../questions/infrastructure/relational/mappers/question.mapper';

// Mock QuestionMapper to isolate tests
jest.mock(
  '../../../../questions/infrastructure/relational/mappers/question.mapper',
  () => ({
    QuestionMapper: {
      toPersistence: jest.fn((question: Question) => {
        const questionEntity = new QuestionEntity();
        questionEntity.id = question.getId();
        questionEntity.content = question.getContent();
        return questionEntity;
      }),
    },
  }),
);

describe('QuizGenerationTaskMapper', () => {
  // Helper functions to create test data
  const createQuestion = (taskId: string = faker.string.uuid()): Question => {
    return new Question({
      id: faker.string.uuid(),
      content: faker.lorem.sentence(),
      answers: [],
      quizGenerationTaskId: taskId,
    });
  };

  const createAnswer = (
    questionId: string = faker.string.uuid(),
    isCorrect = faker.datatype.boolean(),
  ): Answer => {
    return new Answer({
      id: faker.string.uuid(),
      content: faker.lorem.sentence(),
      isCorrect,
      questionId,
    });
  };

  const createQuizGenerationTask = (
    status = QuizGenerationStatus.COMPLETED,
    questionsCount = 2,
    withAnswers = false,
  ): QuizGenerationTask => {
    const id = faker.string.uuid();
    const questions = Array.from({ length: questionsCount }, () => {
      const question = createQuestion(id);

      if (withAnswers) {
        const answers = [
          createAnswer(question.getId(), true),
          createAnswer(question.getId(), false),
        ];
        // Set answers via reflection to maintain proper encapsulation in tests
        Object.defineProperty(question, 'answers', { value: answers });
      }

      return question;
    });

    return new QuizGenerationTask({
      id,
      textContent: faker.lorem.paragraphs(2),
      status,
      questions,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      generatedAt: new Date(),
      userId: faker.string.uuid(),
      title: faker.lorem.sentence(),
    });
  };

  const createAnswerEntity = (
    isCorrect = faker.datatype.boolean(),
  ): AnswerEntity => {
    const answerEntity = new AnswerEntity();
    answerEntity.id = faker.string.uuid();
    answerEntity.content = faker.lorem.sentence();
    answerEntity.isCorrect = isCorrect;
    return answerEntity;
  };

  const createQuestionEntity = (withAnswers = false): QuestionEntity => {
    const questionEntity = new QuestionEntity();
    questionEntity.id = faker.string.uuid();
    questionEntity.content = faker.lorem.sentence();

    if (withAnswers) {
      questionEntity.answers = [
        createAnswerEntity(true),
        createAnswerEntity(false),
      ];
    } else {
      questionEntity.answers = [];
    }

    return questionEntity;
  };

  const createTaskEntity = (
    status = QuizGenerationStatus.COMPLETED,
    withAnswers = true,
    questionsCount = 2,
  ): QuizGenerationTaskEntity => {
    const entity = new QuizGenerationTaskEntity();
    entity.id = faker.string.uuid();
    entity.textContent = faker.lorem.paragraphs(2);
    entity.status = status;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.deletedAt = null;
    entity.generatedAt = new Date();
    entity.userId = faker.string.uuid();
    entity.title = faker.lorem.sentence();

    // Create question entities
    entity.questions = Array.from({ length: questionsCount }, () => {
      const questionEntity = createQuestionEntity(withAnswers);
      return questionEntity;
    });

    return entity;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toEntity', () => {
    it('should map a domain model to an entity with all properties', () => {
      // Arrange
      const domainModel = createQuizGenerationTask();

      // Act
      const entity = QuizGenerationTaskMapper.toEntity(domainModel);

      // Assert
      expect(entity).toBeInstanceOf(QuizGenerationTaskEntity);
      expect(entity.id).toBe(domainModel.getId());
      expect(entity.textContent).toBe(domainModel.getTextContent());
      expect(entity.status).toBe(domainModel.getStatus());
      expect(entity.createdAt).toBe(domainModel.getCreatedAt());
      expect(entity.updatedAt).toBe(domainModel.getUpdatedAt());
      expect(entity.deletedAt).toBe(domainModel.getDeletedAt());
      expect(entity.generatedAt).toBe(domainModel.getGeneratedAt());
      expect(entity.userId).toBe(domainModel.getUserId());
      expect(entity.title).toBe(domainModel.getTitle());

      // Check that QuestionMapper was called for each question
      expect(QuestionMapper.toPersistence).toHaveBeenCalledTimes(
        domainModel.getQuestions().length,
      );
      expect(entity.questions).toHaveLength(domainModel.getQuestions().length);
    });

    it('should map a domain model with empty questions array', () => {
      // Arrange
      const domainModel = createQuizGenerationTask(
        QuizGenerationStatus.PENDING,
        0,
      );

      // Act
      const entity = QuizGenerationTaskMapper.toEntity(domainModel);

      // Assert
      expect(entity.questions).toEqual([]);
      expect(QuestionMapper.toPersistence).not.toHaveBeenCalled();
    });

    it('should preserve status values when mapping to entity', () => {
      // Given statuses to test
      const statuses = [
        QuizGenerationStatus.PENDING,
        QuizGenerationStatus.IN_PROGRESS,
        QuizGenerationStatus.COMPLETED,
        QuizGenerationStatus.FAILED,
      ];

      statuses.forEach((status) => {
        // When mapping a domain model with a specific status
        const domainModel = createQuizGenerationTask(status);
        const entity = QuizGenerationTaskMapper.toEntity(domainModel);

        // Then the entity should have the same status
        expect(entity.status).toBe(status);
      });
    });
  });

  describe('toDomain', () => {
    it('should map an entity to a domain model with all properties', () => {
      // Arrange
      const entity = createTaskEntity();

      // Act
      const domainModel = QuizGenerationTaskMapper.toDomain(entity);

      // Assert
      expect(domainModel).toBeInstanceOf(QuizGenerationTask);
      expect(domainModel.getId()).toBe(entity.id);
      expect(domainModel.getTextContent()).toBe(entity.textContent);
      expect(domainModel.getStatus()).toBe(entity.status);
      expect(domainModel.getCreatedAt()).toBe(entity.createdAt);
      expect(domainModel.getUpdatedAt()).toBe(entity.updatedAt);
      expect(domainModel.getDeletedAt()).toBe(entity.deletedAt);
      expect(domainModel.getGeneratedAt()).toBe(entity.generatedAt);
      expect(domainModel.getUserId()).toBe(entity.userId);
      expect(domainModel.getTitle()).toBe(entity.title);
    });

    it('should map questions and their answers correctly', () => {
      // Arrange
      const entity = createTaskEntity(QuizGenerationStatus.COMPLETED, true);

      // Act
      const domainModel = QuizGenerationTaskMapper.toDomain(entity);

      // Assert
      const questions = domainModel.getQuestions();
      expect(questions).toHaveLength(entity.questions.length);

      questions.forEach((question, qIndex) => {
        expect(question).toBeInstanceOf(Question);
        expect(question.getId()).toBe(entity.questions[qIndex].id);
        expect(question.getContent()).toBe(entity.questions[qIndex].content);

        const answers = question.getAnswers();
        const entityAnswers = entity.questions[qIndex].answers;

        expect(answers).toHaveLength(entityAnswers.length);

        answers.forEach((answer, aIndex) => {
          expect(answer).toBeInstanceOf(Answer);
          expect(answer.getId()).toBe(entityAnswers[aIndex].id);
          expect(answer.getContent()).toBe(entityAnswers[aIndex].content);
          expect(answer.getIsCorrect()).toBe(entityAnswers[aIndex].isCorrect);
          expect(answer.getQuestionId()).toBe(entity.questions[qIndex].id);
        });
      });
    });

    it('should handle entity with empty questions array', () => {
      // Arrange
      const entity = createTaskEntity(QuizGenerationStatus.PENDING, false, 0);

      // Act
      const domainModel = QuizGenerationTaskMapper.toDomain(entity);

      // Assert
      expect(domainModel.getQuestions()).toEqual([]);
    });

    it('should handle questions with empty answers array', () => {
      // Arrange
      const entity = createTaskEntity(QuizGenerationStatus.COMPLETED, false);

      // Act
      const domainModel = QuizGenerationTaskMapper.toDomain(entity);

      // Assert
      const questions = domainModel.getQuestions();
      questions.forEach((question) => {
        expect(question.getAnswers()).toEqual([]);
      });
    });

    it('should handle null dates when mapping to domain model', () => {
      // Arrange
      const entity = createTaskEntity();
      entity.generatedAt = null;
      entity.deletedAt = null;

      // Act
      const domainModel = QuizGenerationTaskMapper.toDomain(entity);

      // Assert
      expect(domainModel.getGeneratedAt()).toBeNull();
      expect(domainModel.getDeletedAt()).toBeNull();
    });
  });

  describe('toDomainList', () => {
    it('should map multiple entities to domain models', () => {
      // Arrange
      const entities = [
        createTaskEntity(QuizGenerationStatus.COMPLETED),
        createTaskEntity(QuizGenerationStatus.PENDING),
        createTaskEntity(QuizGenerationStatus.FAILED),
      ];

      const toDomainSpy = jest.spyOn(QuizGenerationTaskMapper, 'toDomain');

      // Act
      const domainModels = QuizGenerationTaskMapper.toDomainList(entities);

      // Assert
      expect(domainModels).toHaveLength(entities.length);
      expect(toDomainSpy).toHaveBeenCalledTimes(entities.length);

      domainModels.forEach((model, index) => {
        expect(model).toBeInstanceOf(QuizGenerationTask);
        expect(model.getId()).toBe(entities[index].id);
        expect(model.getStatus()).toBe(entities[index].status);
      });

      toDomainSpy.mockRestore();
    });

    it('should return empty array when given empty array', () => {
      // Arrange
      const entities: QuizGenerationTaskEntity[] = [];

      // Act
      const result = QuizGenerationTaskMapper.toDomainList(entities);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined answers array', () => {
      // Arrange
      const entity = createTaskEntity();
      entity.questions.forEach((q) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        q.answers = undefined as any;
      });

      // Act
      const domainModel = QuizGenerationTaskMapper.toDomain(entity);

      // Assert
      domainModel.getQuestions().forEach((q) => {
        expect(q.getAnswers()).toEqual([]);
      });
    });

    it('should handle all status types correctly bidirectionally', () => {
      const statuses = [
        QuizGenerationStatus.PENDING,
        QuizGenerationStatus.IN_PROGRESS,
        QuizGenerationStatus.COMPLETED,
        QuizGenerationStatus.FAILED,
      ];

      statuses.forEach((status) => {
        // Bidirectional mapping test (domain → entity → domain)
        const originalDomain = createQuizGenerationTask(status);
        const entity = QuizGenerationTaskMapper.toEntity(originalDomain);
        const resultDomain = QuizGenerationTaskMapper.toDomain(entity);

        expect(resultDomain.getStatus()).toBe(status);
        expect(entity.status).toBe(status);
      });
    });
  });
});
