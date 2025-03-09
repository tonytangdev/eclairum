import { Test, TestingModule } from '@nestjs/testing';
import { QuizGenerationTasksService } from './quiz-generation-tasks.service';
import { QuestionRepositoryImpl } from '../../questions/infrastructure/relational/repositories/question.repository';
import { AnswerRepositoryImpl } from '../../answers/infrastructure/relational/repositories/answer.repository';
import { DataSource, QueryRunner } from 'typeorm';
import {
  Answer,
  Question,
  QuizGenerationStatus,
} from '@flash-me/core/entities';
import { CreateQuizGenerationTaskDto } from '../dto/create-quiz-generation-task.dto';
import { faker } from '@faker-js/faker';
import { OpenAILLMService } from './openai-llm.service';
import { Logger } from '@nestjs/common';

describe('QuizGenerationTasksService', () => {
  let service: QuizGenerationTasksService;
  let questionRepository: QuestionRepositoryImpl;
  let answerRepository: AnswerRepositoryImpl;
  let openAILLMService: OpenAILLMService;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

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
    // Create mock for query runner with transaction methods
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: jest.fn() as unknown as QueryRunner['manager'],
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
      expect(questionRepository.saveQuestions).toHaveBeenCalled();
      expect(answerRepository.saveAnswers).toHaveBeenCalled();
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

      // Verify OpenAI was called but transaction was never started
      expect(openAILLMService.generateQuiz).toHaveBeenCalledWith(mockDto.text);
      expect(queryRunner.startTransaction).not.toHaveBeenCalled();
    });

    it('should handle database errors and log them properly', async () => {
      // Setup the repository to throw an error
      const errorMessage = `Database error: ${faker.lorem.sentence()}`;
      (questionRepository.saveQuestions as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage),
      );

      // Mock the logger to verify error logging
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      // Execute and expect error
      await expect(service.createTask(mockDto)).rejects.toThrow(errorMessage);

      // Verify error was logged
      expect(loggerErrorSpy).toHaveBeenCalled();

      // Verify OpenAI was successfully called
      expect(openAILLMService.generateQuiz).toHaveBeenCalledWith(mockDto.text);

      // Verify transaction was rolled back
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
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
