import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './services/questions.service';
import { faker } from '@faker-js/faker';

describe('QuestionsController', () => {
  let controller: QuestionsController;

  // Mock the QuestionsService
  const mockQuestionsService = {
    getQuestions: jest.fn(),
    addQuestion: jest.fn(),
    editQuestion: jest.fn(), // Add mock for editQuestion
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        {
          provide: QuestionsService,
          useValue: mockQuestionsService,
        },
      ],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getQuestions', () => {
    it('should return questions for a user without limit', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const mockQuestions = Array.from({ length: 5 }, () => ({
        id: faker.string.uuid(),
        text: faker.lorem.sentence(),
        userId,
      }));
      mockQuestionsService.getQuestions.mockResolvedValue(mockQuestions);

      // Act
      const result = await controller.getQuestions(userId);

      // Assert
      expect(result).toBe(mockQuestions);
      expect(mockQuestionsService.getQuestions).toHaveBeenCalledWith(
        userId,
        undefined,
        undefined,
      );
    });

    it('should return questions for a user with limit', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const limit = faker.number.int({ min: 1, max: 10 });
      const mockQuestions = Array.from({ length: limit }, () => ({
        id: faker.string.uuid(),
        text: faker.lorem.sentence(),
        userId,
      }));
      mockQuestionsService.getQuestions.mockResolvedValue(mockQuestions);

      // Act
      const result = await controller.getQuestions(userId, limit);

      // Assert
      expect(result).toBe(mockQuestions);
      expect(mockQuestionsService.getQuestions).toHaveBeenCalledWith(
        userId,
        limit,
        undefined,
      );
    });

    // Add new test for quizGenerationTaskId parameter
    it('should return questions for a specific quiz generation task', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const limit = faker.number.int({ min: 1, max: 10 });
      const quizGenerationTaskId = faker.string.uuid();
      const mockQuestions = Array.from({ length: limit }, () => ({
        id: faker.string.uuid(),
        text: faker.lorem.sentence(),
        userId,
        quizGenerationTaskId,
      }));
      mockQuestionsService.getQuestions.mockResolvedValue(mockQuestions);

      // Act
      const result = await controller.getQuestions(
        userId,
        limit,
        quizGenerationTaskId,
      );

      // Assert
      expect(result).toBe(mockQuestions);
      expect(mockQuestionsService.getQuestions).toHaveBeenCalledWith(
        userId,
        limit,
        quizGenerationTaskId,
      );
    });

    it('should return questions for a task without specifying limit', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const quizGenerationTaskId = faker.string.uuid();
      const mockQuestions = Array.from({ length: 3 }, () => ({
        id: faker.string.uuid(),
        text: faker.lorem.sentence(),
        userId,
        quizGenerationTaskId,
      }));
      mockQuestionsService.getQuestions.mockResolvedValue(mockQuestions);

      // Act
      const result = await controller.getQuestions(
        userId,
        undefined,
        quizGenerationTaskId,
      );

      // Assert
      expect(result).toBe(mockQuestions);
      expect(mockQuestionsService.getQuestions).toHaveBeenCalledWith(
        userId,
        undefined,
        quizGenerationTaskId,
      );
    });
  });

  describe('addQuestion', () => {
    it('should add a question successfully', async () => {
      // Arrange
      const addQuestionDto = {
        userId: faker.string.uuid(),
        taskId: faker.string.uuid(),
        questionContent: faker.lorem.sentence(),
        answers: [
          { content: faker.lorem.sentence(), isCorrect: true },
          { content: faker.lorem.sentence(), isCorrect: false },
        ],
      };
      const mockQuestion = {
        id: faker.string.uuid(),
        content: addQuestionDto.questionContent,
      };
      mockQuestionsService.addQuestion.mockResolvedValue({
        data: mockQuestion,
        metadata: {
          questionId: mockQuestion.id,
        },
        success: true,
      });

      // Act
      const result = await controller.addQuestion(addQuestionDto);

      // Assert
      expect(result).toEqual({
        data: mockQuestion,
        metadata: {
          questionId: mockQuestion.id,
        },
        success: true,
      });
      expect(mockQuestionsService.addQuestion).toHaveBeenCalledWith(
        addQuestionDto.userId,
        addQuestionDto.taskId,
        addQuestionDto.questionContent,
        addQuestionDto.answers,
      );
    });

    it('should handle errors and return error response', async () => {
      // Arrange
      const addQuestionDto = {
        userId: faker.string.uuid(),
        taskId: faker.string.uuid(),
        questionContent: faker.lorem.sentence(),
        answers: [
          { content: faker.lorem.sentence(), isCorrect: true },
          { content: faker.lorem.sentence(), isCorrect: false },
        ],
      };
      const errorMessage = 'Failed to add question';
      mockQuestionsService.addQuestion.mockResolvedValue({
        data: null,
        metadata: {
          error: errorMessage,
        },
        success: false,
      });

      // Act
      const result = await controller.addQuestion(addQuestionDto);

      // Assert
      expect(result).toEqual({
        data: null,
        metadata: {
          error: errorMessage,
        },
        success: false,
      });
      expect(mockQuestionsService.addQuestion).toHaveBeenCalledWith(
        addQuestionDto.userId,
        addQuestionDto.taskId,
        addQuestionDto.questionContent,
        addQuestionDto.answers,
      );
    });
  });

  describe('editQuestion', () => {
    it('should edit a question successfully', async () => {
      // Arrange
      const editQuestionDto = {
        userId: faker.string.uuid(),
        questionContent: faker.lorem.sentence(),
      };
      const questionId = faker.string.uuid();
      const mockQuestion = {
        id: questionId,
        content: editQuestionDto.questionContent,
      };
      mockQuestionsService.editQuestion.mockResolvedValue({
        data: mockQuestion,
        metadata: {
          questionId: mockQuestion.id,
        },
        success: true,
      });

      // Act
      const result = await controller.editQuestion(editQuestionDto, questionId);

      // Assert
      expect(result).toEqual({
        data: mockQuestion,
        metadata: {
          questionId: mockQuestion.id,
        },
        success: true,
      });
      expect(mockQuestionsService.editQuestion).toHaveBeenCalledWith(
        editQuestionDto.userId,
        questionId,
        editQuestionDto.questionContent,
      );
    });

    it('should handle errors and return error response', async () => {
      // Arrange
      const editQuestionDto = {
        userId: faker.string.uuid(),
        questionContent: faker.lorem.sentence(),
      };
      const questionId = faker.string.uuid();
      const errorMessage = 'Failed to edit question';
      mockQuestionsService.editQuestion.mockResolvedValue({
        data: null,
        metadata: {
          error: errorMessage,
        },
        success: false,
      });

      // Act
      const result = await controller.editQuestion(editQuestionDto, questionId);

      // Assert
      expect(result).toEqual({
        data: null,
        metadata: {
          error: errorMessage,
        },
        success: false,
      });
      expect(mockQuestionsService.editQuestion).toHaveBeenCalledWith(
        editQuestionDto.userId,
        questionId,
        editQuestionDto.questionContent,
      );
    });
  });
});
