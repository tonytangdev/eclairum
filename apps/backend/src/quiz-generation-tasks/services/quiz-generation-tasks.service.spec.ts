import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { QuizGenerationTasksService } from './quiz-generation-tasks.service';
import { QuestionRepositoryImpl } from '../../questions/infrastructure/relational/repositories/question.repository';
import { AnswerRepositoryImpl } from '../../answers/infrastructure/relational/repositories/answer.repository';
import { QuizGenerationTaskRepositoryImpl } from '../infrastructure/relational/repositories/quiz-generation-task.repository';
import { QuestionGenerationService } from './question-generation.service';
import { QuizEntityFactory } from '../factories/quiz-entity.factory';
import { TransactionHelper } from '../../shared/helpers/transaction.helper';
import {
  QuizGenerationTask,
  Question,
  Answer,
  QuizGenerationStatus,
} from '@flash-me/core/entities';
import { faker } from '@faker-js/faker';

describe('QuizGenerationTasksService', () => {
  let quizGenerationTasksService: QuizGenerationTasksService;
  let mockQuestionRepository: Partial<QuestionRepositoryImpl>;
  let mockAnswerRepository: Partial<AnswerRepositoryImpl>;
  let mockTaskRepository: Partial<QuizGenerationTaskRepositoryImpl>;
  let mockQuestionGenerationService: Partial<QuestionGenerationService>;
  let mockQuizEntityFactory: Partial<QuizEntityFactory>;
  let mockTransactionHelper: Partial<TransactionHelper>;

  beforeEach(async () => {
    // Create mock implementations for all dependencies
    mockQuestionRepository = {
      saveQuestions: jest.fn().mockResolvedValue(undefined),
    };

    mockAnswerRepository = {
      saveAnswers: jest.fn().mockResolvedValue(undefined),
    };

    mockTaskRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    };

    mockQuestionGenerationService = {
      generateQuestionsFromText: jest.fn(),
    };

    mockQuizEntityFactory = {
      createTask: jest.fn(),
      createQuestionEntities: jest.fn(),
      extractAllAnswers: jest.fn(),
      addQuestionsToTask: jest.fn(),
    };

    mockTransactionHelper = {
      executeInTransaction: jest
        .fn()
        .mockImplementation(
          (callback: (entityManager: EntityManager) => void) => {
            const mockEntityManager = {} as EntityManager;
            return callback(mockEntityManager);
          },
        ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        QuizGenerationTasksService,
        { provide: QuestionRepositoryImpl, useValue: mockQuestionRepository },
        { provide: AnswerRepositoryImpl, useValue: mockAnswerRepository },
        {
          provide: QuizGenerationTaskRepositoryImpl,
          useValue: mockTaskRepository,
        },
        {
          provide: QuestionGenerationService,
          useValue: mockQuestionGenerationService,
        },
        { provide: QuizEntityFactory, useValue: mockQuizEntityFactory },
        { provide: TransactionHelper, useValue: mockTransactionHelper },
      ],
    }).compile();

    quizGenerationTasksService = moduleRef.get<QuizGenerationTasksService>(
      QuizGenerationTasksService,
    );

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should successfully create and process a quiz generation task', async () => {
      // Arrange
      const createQuizDto = {
        text: faker.lorem.paragraphs(3),
        userId: faker.string.uuid(),
      };

      // Create a mock task with Faker data
      const taskId = faker.string.uuid();
      const generatedDate = faker.date.recent();

      const mockTask = new QuizGenerationTask({
        textContent: createQuizDto.text,
        questions: [],
        status: QuizGenerationStatus.IN_PROGRESS,
        userId: createQuizDto.userId, // Add userId here
      });
      mockTask.updateStatus = jest.fn();
      mockTask.getId = jest.fn().mockReturnValue(taskId);
      mockTask.getQuestions = jest.fn().mockReturnValue([]);
      mockTask.getStatus = jest
        .fn()
        .mockReturnValue(QuizGenerationStatus.COMPLETED);
      mockTask.getGeneratedAt = jest.fn().mockReturnValue(generatedDate);

      // Create mock questions with Faker data
      const mockQuestions: Question[] = Array.from(
        { length: faker.number.int({ min: 2, max: 5 }) },
        () =>
          new Question({
            content: `${faker.lorem.sentence()}?`,
            answers: [],
          }),
      );

      // Create mock answers with Faker data
      const mockAnswers: Answer[] = mockQuestions.flatMap((question) =>
        Array.from(
          { length: faker.number.int({ min: 2, max: 4 }) },
          () =>
            new Answer({
              content: faker.lorem.words(3),
              isCorrect: faker.datatype.boolean(),
              questionId: question.getId(),
            }),
        ),
      );

      // Create mock question-answer pairs with Faker data
      const mockQuestionAnswerPairs = mockQuestions.map((question) => ({
        question: question.getContent(),
        answers: mockAnswers
          .filter((answer) => answer.getQuestionId() === question.getId())
          .map((answer) => ({
            content: answer.getContent(),
            isCorrect: answer.getIsCorrect(),
          })),
      }));

      mockQuizEntityFactory.createTask = jest.fn().mockReturnValue(mockTask);
      mockQuestionGenerationService.generateQuestionsFromText = jest
        .fn()
        .mockResolvedValue(mockQuestionAnswerPairs);
      mockQuizEntityFactory.createQuestionEntities = jest
        .fn()
        .mockReturnValue(mockQuestions);
      mockQuizEntityFactory.extractAllAnswers = jest
        .fn()
        .mockReturnValue(mockAnswers);

      // Act
      const result = await quizGenerationTasksService.createTask(createQuizDto);

      // Assert
      expect(mockQuizEntityFactory.createTask).toHaveBeenCalledWith(
        createQuizDto.text,
        createQuizDto.userId, // Add userId parameter here
      );
      expect(mockTransactionHelper.executeInTransaction).toHaveBeenCalled();
      expect(mockTaskRepository.save).toHaveBeenCalledWith(
        mockTask,
        expect.anything(),
      );
      expect(
        mockQuestionGenerationService.generateQuestionsFromText,
      ).toHaveBeenCalledWith(createQuizDto.text);
      expect(mockQuizEntityFactory.createQuestionEntities).toHaveBeenCalledWith(
        mockQuestionAnswerPairs,
      );
      expect(mockQuestionRepository.saveQuestions).toHaveBeenCalledWith(
        mockQuestions,
        expect.anything(),
      );
      expect(mockAnswerRepository.saveAnswers).toHaveBeenCalledWith(
        mockAnswers,
        expect.anything(),
      );
      expect(mockQuizEntityFactory.addQuestionsToTask).toHaveBeenCalledWith(
        mockTask,
        mockQuestions,
      );
      expect(mockTask.updateStatus).toHaveBeenCalledWith(
        QuizGenerationStatus.COMPLETED,
      );

      expect(result).toEqual({
        taskId,
        userId: createQuizDto.userId,
        status: QuizGenerationStatus.COMPLETED,
        questionsCount: 0, // From the mock implementation of getQuestions
        message: expect.stringContaining(
          'Quiz generation task created with',
        ) as string,
        generatedAt: generatedDate,
      });
    });

    it('should handle and log errors during task creation', async () => {
      // Arrange
      const createQuizDto = {
        text: faker.lorem.paragraphs(2),
        userId: faker.string.uuid(),
      };

      const mockTask = new QuizGenerationTask({
        textContent: createQuizDto.text,
        questions: [],
        status: QuizGenerationStatus.IN_PROGRESS,
        userId: createQuizDto.userId, // Add userId here
      });

      const errorMessage = faker.lorem.sentence();
      mockQuizEntityFactory.createTask = jest.fn().mockReturnValue(mockTask);
      mockTransactionHelper.executeInTransaction = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));

      // Mock the error logger
      const errorLogSpy = jest.spyOn(Logger.prototype, 'error');

      // Act & Assert
      await expect(
        quizGenerationTasksService.createTask(createQuizDto),
      ).rejects.toThrow(errorMessage);

      expect(mockQuizEntityFactory.createTask).toHaveBeenCalledWith(
        createQuizDto.text,
        createQuizDto.userId, // Add userId parameter here
      );
      expect(mockTransactionHelper.executeInTransaction).toHaveBeenCalled();
      expect(errorLogSpy).toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('should retrieve a task by ID', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const mockTask = new QuizGenerationTask({
        textContent: faker.lorem.paragraphs(1),
        questions: [],
        status: QuizGenerationStatus.COMPLETED,
        userId: faker.string.uuid(),
      });

      mockTaskRepository.findById = jest.fn().mockResolvedValue(mockTask);

      // Act
      const result = await quizGenerationTasksService.getTaskById(taskId);

      // Assert
      expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
      expect(result).toBe(mockTask);
    });

    it('should return null when task is not found', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      mockTaskRepository.findById = jest.fn().mockResolvedValue(null);

      // Act
      const result = await quizGenerationTasksService.getTaskById(taskId);

      // Assert
      expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
      expect(result).toBeNull();
    });
  });
});
