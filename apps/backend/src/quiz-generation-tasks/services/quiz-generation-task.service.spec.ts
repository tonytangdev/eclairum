import { Test, TestingModule } from '@nestjs/testing';
import { QuizGenerationTaskService } from './quiz-generation-task.service';
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

describe('QuizGenerationTaskService', () => {
  let service: QuizGenerationTaskService;
  let questionRepository: QuestionRepositoryImpl;
  let answerRepository: AnswerRepositoryImpl;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

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
        QuizGenerationTaskService,
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
      ],
    }).compile();

    service = module.get<QuizGenerationTaskService>(QuizGenerationTaskService);
    questionRepository = module.get<QuestionRepositoryImpl>(
      QuestionRepositoryImpl,
    );
    answerRepository = module.get<AnswerRepositoryImpl>(AnswerRepositoryImpl);
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
          questionsCount: 3, // Default implementation generates 3 questions
          message: expect.stringContaining(
            'Quiz generation task created with',
          ) as string,
        }),
      );
      expect(result.taskId).toBeDefined();
      expect(result.generatedAt).toBeDefined();

      // Verify transaction was properly managed
      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(questionRepository.saveQuestions).toHaveBeenCalled();
      expect(answerRepository.saveAnswers).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should handle errors and log them properly', async () => {
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

      // Verify transaction was rolled back
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  it('should return the expected number of questions', async () => {
    // Arrange - setup for a specific number of questions
    // We don't need to do anything special since we're testing the actual implementation

    // Act
    const result = await service.createTask({
      text: faker.lorem.paragraphs(2),
      userId: faker.string.uuid(),
    });

    // Assert
    expect(result.questionsCount).toBe(3); // Current implementation returns 3 questions
    expect(result.message).toBe(
      'Quiz generation task created with 3 questions',
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
