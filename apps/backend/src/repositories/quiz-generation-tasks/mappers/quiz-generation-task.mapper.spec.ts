import { QuizGenerationTaskMapper } from './quiz-generation-task.mapper';
import {
  QuizGenerationTask,
  Question,
  QuizGenerationStatus,
  Answer,
} from '@eclairum/core/entities';
import { faker } from '@faker-js/faker';
import { QuestionEntity } from '../../../common/entities/question.entity';
import { AnswerEntity } from '../../../common/entities/answer.entity';
import { QuizGenerationTaskEntity } from '../../../common/entities/quiz-generation-task.entity';
import { QuestionMapper } from '../../questions/mappers/question.mapper';

// Mock QuestionMapper to isolate tests
jest.mock('../../questions/mappers/question.mapper', () => ({
  QuestionMapper: {
    toPersistence: jest.fn((question: Question) => {
      const questionEntity = new QuestionEntity();
      questionEntity.id = question.getId();
      questionEntity.content = question.getContent();
      return questionEntity;
    }),
  },
}));

describe('QuizGenerationTaskMapper', () => {
  const createTestQuestion = (
    props: {
      taskId?: string;
      withAnswers?: boolean;
      correctAnswerCount?: number;
      wrongAnswerCount?: number;
    } = {},
  ): Question => {
    const {
      taskId = faker.string.uuid(),
      withAnswers = false,
      correctAnswerCount = 1,
      wrongAnswerCount = 3,
    } = props;

    // Create question with appropriate answers
    if (!withAnswers) {
      return new Question({
        id: faker.string.uuid(),
        content: faker.lorem.sentence(),
        answers: [],
        quizGenerationTaskId: taskId,
      });
    }

    // Create the answers first
    const questionId = faker.string.uuid();
    const answers: Answer[] = [];

    // Add correct answers
    for (let i = 0; i < correctAnswerCount; i++) {
      answers.push(
        new Answer({
          id: faker.string.uuid(),
          content: faker.lorem.sentence(),
          isCorrect: true,
          questionId,
        }),
      );
    }

    // Add wrong answers
    for (let i = 0; i < wrongAnswerCount; i++) {
      answers.push(
        new Answer({
          id: faker.string.uuid(),
          content: faker.lorem.sentence(),
          isCorrect: false,
          questionId,
        }),
      );
    }

    return new Question({
      id: questionId,
      content: faker.lorem.sentence(),
      answers,
      quizGenerationTaskId: taskId,
    });
  };

  const createTestTask = (
    props: {
      status?: QuizGenerationStatus;
      questionCount?: number;
      withAnswers?: boolean;
    } = {},
  ): QuizGenerationTask => {
    const {
      status = QuizGenerationStatus.COMPLETED,
      questionCount = 2,
      withAnswers = false,
    } = props;

    const id = faker.string.uuid();
    const questions = Array(questionCount)
      .fill(null)
      .map(() => createTestQuestion({ taskId: id, withAnswers }));

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
    props: {
      isCorrect?: boolean;
    } = {},
  ): AnswerEntity => {
    const { isCorrect = faker.datatype.boolean() } = props;

    const entity = new AnswerEntity();
    entity.id = faker.string.uuid();
    entity.content = faker.lorem.sentence();
    entity.isCorrect = isCorrect;
    entity.questionId = faker.string.uuid();
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.deletedAt = null;
    return entity;
  };

  const createQuestionEntity = (
    props: {
      withAnswers?: boolean;
      correctAnswerCount?: number;
      wrongAnswerCount?: number;
    } = {},
  ): QuestionEntity => {
    const {
      withAnswers = false,
      correctAnswerCount = 1,
      wrongAnswerCount = 3,
    } = props;

    const entity = new QuestionEntity();
    entity.id = faker.string.uuid();
    entity.content = faker.lorem.sentence();
    entity.quizGenerationTaskId = faker.string.uuid();
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    entity.deletedAt = null;

    if (withAnswers) {
      // Create correct answers
      const correctAnswers = Array(correctAnswerCount)
        .fill(null)
        .map(() => createAnswerEntity({ isCorrect: true }));

      // Create wrong answers
      const wrongAnswers = Array(wrongAnswerCount)
        .fill(null)
        .map(() => createAnswerEntity({ isCorrect: false }));

      entity.answers = [...correctAnswers, ...wrongAnswers];
    } else {
      entity.answers = [];
    }

    return entity;
  };

  const createTaskEntity = (
    props: {
      status?: QuizGenerationStatus;
      questionCount?: number;
      withAnswers?: boolean;
    } = {},
  ): QuizGenerationTaskEntity => {
    const {
      status = QuizGenerationStatus.COMPLETED,
      questionCount = 2,
      withAnswers = false,
    } = props;

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
    entity.questions = Array(questionCount)
      .fill(null)
      .map(() => createQuestionEntity({ withAnswers }));

    return entity;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toEntity', () => {
    it('should map all domain model properties to the corresponding entity', () => {
      // Given a quiz generation task domain model
      const domainTask = createTestTask();

      // When mapping to an entity
      const entity = QuizGenerationTaskMapper.toEntity(domainTask);

      // Then all properties should be correctly mapped
      expect(entity).toBeInstanceOf(QuizGenerationTaskEntity);
      expect(entity.id).toBe(domainTask.getId());
      expect(entity.textContent).toBe(domainTask.getTextContent());
      expect(entity.status).toBe(domainTask.getStatus());
      expect(entity.createdAt).toBe(domainTask.getCreatedAt());
      expect(entity.updatedAt).toBe(domainTask.getUpdatedAt());
      expect(entity.deletedAt).toBe(domainTask.getDeletedAt());
      expect(entity.generatedAt).toBe(domainTask.getGeneratedAt());
      expect(entity.userId).toBe(domainTask.getUserId());
      expect(entity.title).toBe(domainTask.getTitle());
    });

    it('should map domain questions to entity questions using QuestionMapper', () => {
      // Given a task with questions
      const domainTask = createTestTask({ questionCount: 3 });

      // When mapping to an entity
      const entity = QuizGenerationTaskMapper.toEntity(domainTask);

      // Then the QuestionMapper should be used for each question
      expect(QuestionMapper.toPersistence).toHaveBeenCalledTimes(3);
      expect(entity.questions).toHaveLength(3);

      // And each question should have been mapped with the mapper
      domainTask.getQuestions().forEach((question) => {
        expect(QuestionMapper.toPersistence).toHaveBeenCalledWith(question);
      });
    });

    it('should handle domain models with no questions', () => {
      // Given a task without questions
      const domainTask = createTestTask({ questionCount: 0 });

      // When mapping to an entity
      const entity = QuizGenerationTaskMapper.toEntity(domainTask);

      // Then the result should have an empty questions array
      expect(entity.questions).toEqual([]);
      expect(QuestionMapper.toPersistence).not.toHaveBeenCalled();
    });

    it('should correctly map each status type', () => {
      // Given all possible status values
      const statuses = [
        QuizGenerationStatus.PENDING,
        QuizGenerationStatus.IN_PROGRESS,
        QuizGenerationStatus.COMPLETED,
        QuizGenerationStatus.FAILED,
      ];

      // For each status value
      statuses.forEach((status) => {
        // When mapping a domain model with that status
        const domainTask = createTestTask({ status });
        const entity = QuizGenerationTaskMapper.toEntity(domainTask);

        // Then the entity should have the same status
        expect(entity.status).toBe(status);
      });
    });
  });

  describe('toDomain', () => {
    it('should map all entity properties to the corresponding domain model', () => {
      // Given a quiz generation task entity
      const entity = createTaskEntity();

      // When mapping to a domain model
      const domainTask = QuizGenerationTaskMapper.toDomain(entity);

      // Then all properties should be correctly mapped
      expect(domainTask).toBeInstanceOf(QuizGenerationTask);
      expect(domainTask.getId()).toBe(entity.id);
      expect(domainTask.getTextContent()).toBe(entity.textContent);
      expect(domainTask.getStatus()).toBe(entity.status);
      expect(domainTask.getCreatedAt()).toBe(entity.createdAt);
      expect(domainTask.getUpdatedAt()).toBe(entity.updatedAt);
      expect(domainTask.getDeletedAt()).toBe(entity.deletedAt);
      expect(domainTask.getGeneratedAt()).toBe(entity.generatedAt);
      expect(domainTask.getUserId()).toBe(entity.userId);
      expect(domainTask.getTitle()).toBe(entity.title);
    });

    it('should create domain questions with their answers', () => {
      // Given a task entity with questions and answers
      const entity = createTaskEntity({
        questionCount: 2,
        withAnswers: true,
      });

      // When mapping to a domain model
      const domainTask = QuizGenerationTaskMapper.toDomain(entity);

      // Then questions and answers should be correctly mapped
      const questions = domainTask.getQuestions();
      expect(questions).toHaveLength(2);

      // And each question should have its answers
      questions.forEach((question, qIndex) => {
        expect(question).toBeInstanceOf(Question);
        expect(question.getId()).toBe(entity.questions[qIndex].id);
        expect(question.getContent()).toBe(entity.questions[qIndex].content);

        // And the answers should be mapped correctly
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

    it('should handle entities with no questions', () => {
      // Given a task entity without questions
      const entity = createTaskEntity({ questionCount: 0 });

      // When mapping to a domain model
      const domainTask = QuizGenerationTaskMapper.toDomain(entity);

      // Then the result should have an empty questions array
      expect(domainTask.getQuestions()).toEqual([]);
    });

    it('should handle questions with no answers', () => {
      // Given a task entity with questions but no answers
      const entity = createTaskEntity({
        questionCount: 2,
        withAnswers: false,
      });

      // When mapping to a domain model
      const domainTask = QuizGenerationTaskMapper.toDomain(entity);

      // Then each question should have an empty answers array
      const questions = domainTask.getQuestions();
      questions.forEach((question) => {
        expect(question.getAnswers()).toEqual([]);
      });
    });

    it('should handle undefined answers gracefully', () => {
      // Given a task entity with undefined answer arrays
      const entity = createTaskEntity({ questionCount: 2 });
      entity.questions.forEach((q) => {
        q.answers = undefined as unknown as AnswerEntity[];
      });

      // When mapping to a domain model
      const domainTask = QuizGenerationTaskMapper.toDomain(entity);

      // Then each question should have an empty answers array
      const questions = domainTask.getQuestions();
      questions.forEach((question) => {
        expect(question.getAnswers()).toEqual([]);
      });
    });

    it('should handle null date fields', () => {
      // Given a task entity with null dates
      const entity = createTaskEntity();
      entity.generatedAt = null;
      entity.deletedAt = null;

      // When mapping to a domain model
      const domainTask = QuizGenerationTaskMapper.toDomain(entity);

      // Then the null dates should be preserved
      expect(domainTask.getGeneratedAt()).toBeNull();
      expect(domainTask.getDeletedAt()).toBeNull();
    });
  });

  describe('toDomainList', () => {
    it('should map a list of entities to a list of domain models', () => {
      // Given a list of task entities with different statuses
      const entities = [
        createTaskEntity({ status: QuizGenerationStatus.PENDING }),
        createTaskEntity({ status: QuizGenerationStatus.IN_PROGRESS }),
        createTaskEntity({ status: QuizGenerationStatus.COMPLETED }),
      ];

      // When mapping to domain models
      const domainTasks = QuizGenerationTaskMapper.toDomainList(entities);

      // Then all entities should be correctly mapped
      expect(domainTasks).toHaveLength(3);
      expect(domainTasks[0].getStatus()).toBe(QuizGenerationStatus.PENDING);
      expect(domainTasks[1].getStatus()).toBe(QuizGenerationStatus.IN_PROGRESS);
      expect(domainTasks[2].getStatus()).toBe(QuizGenerationStatus.COMPLETED);
    });

    it('should return an empty array when given an empty array', () => {
      // Given an empty array of entities
      const emptyList: QuizGenerationTaskEntity[] = [];

      // When mapping to domain models
      const result = QuizGenerationTaskMapper.toDomainList(emptyList);

      // Then the result should be an empty array
      expect(result).toEqual([]);
    });

    it('should use toDomain for each entity in the list', () => {
      // Given a list of entities
      const entities = [
        createTaskEntity(),
        createTaskEntity(),
        createTaskEntity(),
      ];

      // Spy on the toDomain method
      const toDomainSpy = jest.spyOn(QuizGenerationTaskMapper, 'toDomain');

      // When mapping to domain models
      QuizGenerationTaskMapper.toDomainList(entities);

      // Then toDomain should be called for each entity
      expect(toDomainSpy).toHaveBeenCalledTimes(3);
      entities.forEach((entity) => {
        expect(toDomainSpy).toHaveBeenCalledWith(entity);
      });

      // Clean up
      toDomainSpy.mockRestore();
    });
  });

  describe('Bidirectional mapping', () => {
    it('should preserve all properties when mapping domain → entity → domain', () => {
      // Given a domain task with specific properties
      const originalTask = createTestTask({
        status: QuizGenerationStatus.IN_PROGRESS,
        questionCount: 2,
        withAnswers: true,
      });

      // When mapping domain → entity → domain
      const entity = QuizGenerationTaskMapper.toEntity(originalTask);

      // Spy on the toDomain method to check if it's called correctly
      const toDomainSpy = jest.spyOn(QuizGenerationTaskMapper, 'toDomain');
      QuizGenerationTaskMapper.toDomain(entity);

      // Then the toDomain method should be called with the entity
      expect(toDomainSpy).toHaveBeenCalledWith(entity);

      // Restore the spy
      toDomainSpy.mockRestore();
    });

    it('should preserve all status types in bidirectional mapping', () => {
      // Given all possible status values
      const statuses = [
        QuizGenerationStatus.PENDING,
        QuizGenerationStatus.IN_PROGRESS,
        QuizGenerationStatus.COMPLETED,
        QuizGenerationStatus.FAILED,
      ];

      // For each status
      statuses.forEach((status) => {
        // When mapping domain → entity → domain
        const originalTask = createTestTask({ status });
        const entity = QuizGenerationTaskMapper.toEntity(originalTask);
        const resultTask = QuizGenerationTaskMapper.toDomain(entity);

        // Then the status should be preserved
        expect(resultTask.getStatus()).toBe(status);
      });
    });
  });
});
