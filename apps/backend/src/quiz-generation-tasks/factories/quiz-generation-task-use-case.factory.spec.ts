import { QuizGenerationTaskUseCaseFactory } from './quiz-generation-task-use-case.factory';
import {
  CreateQuizGenerationTaskUseCase,
  FetchQuizGenerationTaskForUserUseCase,
  FetchQuizGenerationTasksForUserUseCase,
  SoftDeleteQuizGenerationTaskForUserUseCase,
  ResumeQuizGenerationTaskAfterUploadUseCase,
} from '@eclairum/core/use-cases';
import { LLMService } from '@eclairum/core/interfaces/llm-service.interface';
import { QuestionRepositoryImpl } from '../../repositories/questions/question.repository';
import { QuizGenerationTaskRepositoryImpl } from '../../repositories/quiz-generation-tasks/quiz-generation-task.repository';
import { UserRepositoryImpl } from '../../repositories/users/user.repository';
import { AnswerRepositoryImpl } from '../../repositories/answers/answer.repository';
import { FileRepository, FileUploadService } from '@eclairum/core/interfaces';
import { OCRService } from '@eclairum/core/interfaces/ocr-service.interface';

describe('QuizGenerationTaskUseCaseFactory', () => {
  // Mock dependencies
  let llmService: jest.Mocked<LLMService>;
  let questionRepository: jest.Mocked<QuestionRepositoryImpl>;
  let answerRepository: jest.Mocked<AnswerRepositoryImpl>;
  let quizGenerationTaskRepository: jest.Mocked<QuizGenerationTaskRepositoryImpl>;
  let userRepository: jest.Mocked<UserRepositoryImpl>;
  let fileRepository: jest.Mocked<FileRepository>;
  let fileUploadService: jest.Mocked<FileUploadService>;
  let ocrService: jest.Mocked<OCRService>;

  // Factory instance
  let factory: QuizGenerationTaskUseCaseFactory;

  beforeEach(() => {
    // Create mocks for all dependencies
    llmService = {
      generateQuiz: jest.fn(),
    } as unknown as jest.Mocked<LLMService>;

    questionRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<QuestionRepositoryImpl>;

    answerRepository = {
      findByQuestionId: jest.fn(),
    } as unknown as jest.Mocked<AnswerRepositoryImpl>;

    quizGenerationTaskRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTaskRepositoryImpl>;

    userRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepositoryImpl>;

    fileRepository = {
      save: jest.fn(),
      findByQuizGenerationTaskId: jest.fn(),
    } as unknown as jest.Mocked<FileRepository>;

    fileUploadService = {
      generateUploadUrl: jest.fn(),
    } as unknown as jest.Mocked<FileUploadService>;

    ocrService = {
      extractTextFromFile: jest.fn(),
    } as unknown as jest.Mocked<OCRService>;

    // Create factory instance with mocked dependencies
    factory = new QuizGenerationTaskUseCaseFactory(
      llmService,
      questionRepository,
      answerRepository,
      quizGenerationTaskRepository,
      userRepository,
      fileRepository,
      fileUploadService,
      ocrService,
    );
  });

  describe('createCreateTaskUseCase', () => {
    it('should create a use case that can create quiz generation tasks', () => {
      // Given
      const useCase = factory.createCreateTaskUseCase();

      // When/Then
      expect(useCase).toBeInstanceOf(CreateQuizGenerationTaskUseCase);
      expect(typeof useCase.execute).toBe('function');
    });
  });

  describe('createFetchTaskUseCase', () => {
    it('should create a use case that can fetch a single quiz generation task for a user', () => {
      // Given
      const useCase = factory.createFetchTaskUseCase();

      // When/Then
      expect(useCase).toBeInstanceOf(FetchQuizGenerationTaskForUserUseCase);
      expect(typeof useCase.execute).toBe('function');
    });
  });

  describe('createFetchTasksUseCase', () => {
    it('should create a use case that can fetch multiple quiz generation tasks for a user', () => {
      // Given
      const useCase = factory.createFetchTasksUseCase();

      // When/Then
      expect(useCase).toBeInstanceOf(FetchQuizGenerationTasksForUserUseCase);
      expect(typeof useCase.execute).toBe('function');
    });
  });

  describe('createDeleteTaskUseCase', () => {
    it('should create a use case that can delete a quiz generation task for a user', () => {
      // Given
      const useCase = factory.createDeleteTaskUseCase();

      // When/Then
      expect(useCase).toBeInstanceOf(
        SoftDeleteQuizGenerationTaskForUserUseCase,
      );
      expect(typeof useCase.execute).toBe('function');
    });
  });

  describe('createResumeTaskAfterUploadUseCase', () => {
    it('should create a use case that can resume a quiz generation task after file upload', () => {
      // Given
      const useCase = factory.createResumeTaskAfterUploadUseCase();

      // When/Then
      expect(useCase).toBeInstanceOf(
        ResumeQuizGenerationTaskAfterUploadUseCase,
      );
      expect(typeof useCase.execute).toBe('function');
    });

    it('should throw an error when OCR service is not provided', () => {
      // Given
      const factoryWithoutOCR = new QuizGenerationTaskUseCaseFactory(
        llmService,
        questionRepository,
        answerRepository,
        quizGenerationTaskRepository,
        userRepository,
        fileRepository,
        fileUploadService,
        undefined, // No OCR service
      );

      // When/Then
      expect(() =>
        factoryWithoutOCR.createResumeTaskAfterUploadUseCase(),
      ).toThrow('OCR service is required to resume a task after upload');
    });

    it('should throw an error when file repository is not provided', () => {
      // Given
      const factoryWithoutFileRepository = new QuizGenerationTaskUseCaseFactory(
        llmService,
        questionRepository,
        answerRepository,
        quizGenerationTaskRepository,
        userRepository,
        undefined, // No file repository
        fileUploadService,
        ocrService,
      );

      // When/Then
      expect(() =>
        factoryWithoutFileRepository.createResumeTaskAfterUploadUseCase(),
      ).toThrow('File repository is required to resume a task after upload');
    });
  });

  describe('factory initialization', () => {
    it('should create a factory with required dependencies', () => {
      // Given
      const minimalFactory = new QuizGenerationTaskUseCaseFactory(
        llmService,
        questionRepository,
        answerRepository,
        quizGenerationTaskRepository,
        userRepository,
      );

      // When/Then
      expect(minimalFactory).toBeDefined();

      // Should be able to create basic use cases without optional dependencies
      expect(minimalFactory.createCreateTaskUseCase()).toBeInstanceOf(
        CreateQuizGenerationTaskUseCase,
      );
      expect(minimalFactory.createFetchTaskUseCase()).toBeInstanceOf(
        FetchQuizGenerationTaskForUserUseCase,
      );
      expect(minimalFactory.createFetchTasksUseCase()).toBeInstanceOf(
        FetchQuizGenerationTasksForUserUseCase,
      );
      expect(minimalFactory.createDeleteTaskUseCase()).toBeInstanceOf(
        SoftDeleteQuizGenerationTaskForUserUseCase,
      );
    });
  });
});
