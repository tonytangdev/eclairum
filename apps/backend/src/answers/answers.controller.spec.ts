import { Test, TestingModule } from '@nestjs/testing';
import { AnswersController } from './answers.controller';
import { AnswersService } from './answers.service';
import { EditAnswerDto } from './dto/edit-answer.dto';
import { faker } from '@faker-js/faker';

describe('AnswersController', () => {
  let controller: AnswersController;
  let service: AnswersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnswersController],
      providers: [
        {
          provide: AnswersService,
          useValue: {
            editAnswer: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AnswersController>(AnswersController);
    service = module.get<AnswersService>(AnswersService);
  });

  describe('updateAnswer', () => {
    it('should call AnswersService.editAnswer with correct parameters', async () => {
      // Arrange
      const answerId = faker.string.uuid();
      const editAnswerDto: EditAnswerDto = {
        userId: 'user-123',
        answerContent: 'Paris',
        isCorrect: true,
      };

      // Act
      await controller.updateAnswer(answerId, editAnswerDto);

      // Assert
      expect(service.editAnswer).toHaveBeenCalledWith(
        editAnswerDto.userId,
        answerId,
        editAnswerDto.answerContent,
        editAnswerDto.isCorrect,
      );
    });

    it('should return the result from AnswersService.editAnswer', async () => {
      // Arrange
      const answerId = faker.string.uuid();
      const editAnswerDto: EditAnswerDto = {
        userId: 'user-123',
        answerContent: 'Paris',
        isCorrect: true,
      };
      const expectedResult = { success: true } as unknown as ReturnType<
        (typeof service)['editAnswer']
      >;

      jest.spyOn(service, 'editAnswer').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.updateAnswer(answerId, editAnswerDto);

      // Assert
      expect(result).toBe(expectedResult);
    });
  });
});
