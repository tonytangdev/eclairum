import { Test, TestingModule } from '@nestjs/testing';
import { AnswersService } from './answers.service';
import { UserRepositoryImpl } from '../repositories/users/user.repository';
import { AnswerRepositoryImpl } from '../repositories/answers/answer.repository';
import { QuizGenerationTaskRepositoryImpl } from '../repositories/quiz-generation-tasks/quiz-generation-task.repository';
import { QuestionRepositoryImpl } from '../repositories/questions/question.repository';
import { UserEditsAnswerUseCase } from '@eclairum/core/use-cases';
import { faker } from '@faker-js/faker';

describe('AnswersService', () => {
  let service: AnswersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswersService,
        {
          provide: UserRepositoryImpl,
          useValue: {},
        },
        {
          provide: AnswerRepositoryImpl,
          useValue: {},
        },
        {
          provide: QuizGenerationTaskRepositoryImpl,
          useValue: {},
        },
        {
          provide: QuestionRepositoryImpl,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AnswersService>(AnswersService);
  });

  describe('editAnswer', () => {
    it('should return success when editAnswerUseCase executes successfully', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const answerId = faker.string.uuid();
      const answerContent = 'New Answer';
      const isCorrect = true;

      const mockResult = {
        answer: {
          getId: jest.fn().mockReturnValue(answerId),
        },
      } as unknown as Awaited<
        ReturnType<(typeof UserEditsAnswerUseCase.prototype)['execute']>
      >;

      jest
        .spyOn(UserEditsAnswerUseCase.prototype, 'execute')
        .mockResolvedValue(mockResult);

      // Act
      const result = await service.editAnswer(
        userId,
        answerId,
        answerContent,
        isCorrect,
      );

      // Assert
      expect(result).toEqual({
        data: mockResult.answer,
        metadata: {
          answerId: answerId,
        },
        success: true,
      });
    });

    it('should return failure when editAnswerUseCase throws an error', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const answerId = faker.string.uuid();
      const answerContent = 'New Answer';
      const isCorrect = true;
      const errorMessage = 'Something went wrong';

      jest
        .spyOn(UserEditsAnswerUseCase.prototype, 'execute')
        .mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await service.editAnswer(
        userId,
        answerId,
        answerContent,
        isCorrect,
      );

      // Assert
      expect(result).toEqual({
        data: null,
        metadata: {
          error: errorMessage,
        },
        success: false,
      });
    });
  });
});
