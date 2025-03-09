import { Test, TestingModule } from '@nestjs/testing';
import { QuizGenerationTasksService } from './quiz-generation-tasks.service';
import { QuestionRepositoryImpl } from '../../questions/infrastructure/relational/repositories/question.repository';
import { AnswerRepositoryImpl } from '../../answers/infrastructure/relational/repositories/answer.repository';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import {
  Answer,
  Question,
  QuizGenerationStatus,
  QuizGenerationTask,
} from '@flash-me/core/entities';
import { CreateQuizGenerationTaskDto } from '../dto/create-quiz-generation-task.dto';
import { faker } from '@faker-js/faker';
import { OpenAILLMService } from './openai-llm.service';
import { Logger } from '@nestjs/common';
import { QuizGenerationTaskRepositoryImpl } from '../infrastructure/relational/repositories/quiz-generation-task.repository';

describe('QuizGenerationTasksService', () => {
  let service: QuizGenerationTasksService;
  let questionRepository: QuestionRepositoryImpl;
  let answerRepository: AnswerRepositoryImpl;
  let quizGenerationTaskRepository: QuizGenerationTaskRepositoryImpl;
  let openAILLMService: OpenAILLMService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let entityManager: EntityManager;

  // Setup mock questions that will be returned from OpenAI
  const generateMockQuizQuestions = (count = 10) =>
    Array(count)
      .fill(null)
      .map(() => ({
        question: faker.lorem.sentence() + '?',
        answers: Array(4)
          .fill(null)
          .map((_, i) => ({
            text: faker.lorem.sentence(),
            isCorrect: i === 0, // First answer is correct
          })),
      }));

  beforeEach(async () => {
    // Create mock for entity manager
    entityManager = {
      getRepository: jest.fn().mockReturnValue({
        save: jest.fn().mockResolvedValue({}),
      }),
    } as unknown as EntityManager;

    // Create mock for query runner with transaction methods
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: entityManager,
    } as unknown as QueryRunner;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizGenerationTasksService,
        {
          provide: QuestionRepositoryImpl,
          useValue: {
            saveQuestions: jest
              .fn()
              .mockImplementation(async (questions: Question[]) => {
                // Return the questions as if they were successfully saved
                return Promise.resolve(questions);
              }),
          },
        },
        {
          provide: AnswerRepositoryImpl,
          useValue: {
            saveAnswers: jest
              .fn()
              .mockImplementation(async (answers: Answer[]) => {
                // Return the answers as if they were successfully saved
                return Promise.resolve(answers);
              }),
          },
        },
        {
          provide: QuizGenerationTaskRepositoryImpl,
          useValue: {
            save: jest
              .fn()
              .mockImplementation(async (task: QuizGenerationTask) => {
                // Return the task as if it was successfully saved
                return Promise.resolve(task);
              }),
            findById: jest.fn().mockImplementation((id: string) => {
              // Return a mock task for the given ID
              const task = new QuizGenerationTask({
                id,
                textContent: faker.lorem.paragraphs(1),
                status: QuizGenerationStatus.COMPLETED,
                questions: [],
              });
              return Promise.resolve(task);
            }),
            saveTask: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
          },
        },
        {
          provide: OpenAILLMService,
          useValue: {
            generateQuiz: jest
              .fn()
              .mockResolvedValue(generateMockQuizQuestions()),
          },
        },
      ],
    }).compile();

    // Mock logger to avoid console outputs during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    service = module.get<QuizGenerationTasksService>(
      QuizGenerationTasksService,
    );
    questionRepository = module.get<QuestionRepositoryImpl>(
      QuestionRepositoryImpl,
    );
    answerRepository = module.get<AnswerRepositoryImpl>(AnswerRepositoryImpl);
    quizGenerationTaskRepository = module.get<QuizGenerationTaskRepositoryImpl>(
      QuizGenerationTaskRepositoryImpl,
    );
    openAILLMService = module.get<OpenAILLMService>(OpenAILLMService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTask', () => {
    const mockDto: CreateQuizGenerationTaskDto = {
      text: faker.lorem.paragraphs(3),
      userId: faker.string.uuid(),
    };

    it('should successfully create a quiz generation task', async () => {
      // Execute the service method
      const result = await service.createTask(mockDto);

      // Assert the result structure
      expect(result).toEqual(
        expect.objectContaining({
          userId: mockDto.userId,
          status: QuizGenerationStatus.COMPLETED,
          questionsCount: 10, // Now expecting 10 questions from OpenAI
          message: expect.stringContaining(
            'Quiz generation task created with',
          ) as string,
        }),
      );
      expect(result.taskId).toBeDefined();
      expect(result.generatedAt).toBeDefined();

      // Verify OpenAI service was called
      expect(openAILLMService.generateQuiz).toHaveBeenCalledWith(mockDto.text);

      // Verify transaction was properly managed
      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();

      // Verify repositories were called with transaction manager
      expect(quizGenerationTaskRepository.save).toHaveBeenCalledTimes(2);
      expect(quizGenerationTaskRepository.save).toHaveBeenCalledWith(
        expect.any(QuizGenerationTask),
        queryRunner.manager,
      );
      expect(questionRepository.saveQuestions).toHaveBeenCalledWith(
        expect.any(Array),
        queryRunner.manager,
      );
      expect(answerRepository.saveAnswers).toHaveBeenCalledWith(
        expect.any(Array),
        queryRunner.manager,
      );

      // Verify transaction was committed and released
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle OpenAI errors properly', async () => {
      // Setup OpenAI service to throw an error
      const errorMessage = 'OpenAI API error';
      (openAILLMService.generateQuiz as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage),
      );

      // Mock the logger to verify error logging
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      // Execute and expect error
      await expect(service.createTask(mockDto)).rejects.toThrow(errorMessage);

      // Verify error was logged
      expect(loggerErrorSpy).toHaveBeenCalled();

      // Verify OpenAI was called
      expect(openAILLMService.generateQuiz).toHaveBeenCalledWith(mockDto.text);

      // Verify transaction was rolled back and released
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle task repository save errors and rollback transaction', async () => {
      // Setup the repository to throw an error on second save
      const errorMessage = `Task repository error: ${faker.lorem.sentence()}`;
      (quizGenerationTaskRepository.save as jest.Mock)
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error(errorMessage));

      // Execute and expect error
      await expect(service.createTask(mockDto)).rejects.toThrow(errorMessage);

      // Verify transaction was rolled back and released
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle question repository errors and rollback transaction', async () => {
      // Setup the repository to throw an error
      const errorMessage = `Question repository error: ${faker.lorem.sentence()}`;
      (questionRepository.saveQuestions as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage),
      );

      // Execute and expect error
      await expect(service.createTask(mockDto)).rejects.toThrow(errorMessage);

      // Verify transaction was rolled back and released
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('should return a task when it exists', async () => {
      // Arrange
      const taskId = faker.string.uuid();

      // Act
      const result = await service.getTaskById(taskId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.getId()).toBe(taskId);
      expect(quizGenerationTaskRepository.findById).toHaveBeenCalledWith(
        taskId,
      );
    });

    it('should return null when task does not exist', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      (
        quizGenerationTaskRepository.findById as jest.Mock
      ).mockResolvedValueOnce(null);

      // Act
      const result = await service.getTaskById(taskId);

      // Assert
      expect(result).toBeNull();
      expect(quizGenerationTaskRepository.findById).toHaveBeenCalledWith(
        taskId,
      );
    });
  });

  it('should return the expected number of questions from OpenAI', async () => {
    // Arrange - setup for a specific number of questions (7)
    const customQuestionCount = 7;
    (openAILLMService.generateQuiz as jest.Mock).mockResolvedValueOnce(
      generateMockQuizQuestions(customQuestionCount),
    );

    // Act
    const result = await service.createTask({
      text: faker.lorem.paragraphs(2),
      userId: faker.string.uuid(),
    });

    // Assert
    expect(result.questionsCount).toBe(customQuestionCount);
    expect(result.message).toBe(
      `Quiz generation task created with ${customQuestionCount} questions`,
    );
  });

  it('should properly pass user ID through to the result', async () => {
    // Arrange
    const userId = faker.string.uuid();

    // Act
    const result = await service.createTask({
      text: faker.lorem.paragraph(),
      userId,
    });

    // Assert
    expect(result.userId).toBe(userId);
  });
});
