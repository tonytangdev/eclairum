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

export class QuizGenerationTaskUseCaseFactory {
  constructor(
    private readonly llmService: LLMService,
    private readonly questionRepository: QuestionRepositoryImpl,
    private readonly answerRepository: AnswerRepositoryImpl,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepositoryImpl,
    private readonly userRepository: UserRepositoryImpl,
    private readonly fileRepository?: FileRepository,
    private readonly fileUploadService?: FileUploadService,
    private readonly ocrService?: OCRService,
  ) {}

  /**
   * Creates a new instance of the CreateQuizGenerationTaskUseCase
   */
  createCreateTaskUseCase(): CreateQuizGenerationTaskUseCase {
    return new CreateQuizGenerationTaskUseCase(
      this.llmService,
      this.questionRepository,
      this.answerRepository,
      this.quizGenerationTaskRepository,
      this.userRepository,
      this.fileRepository,
      this.fileUploadService,
    );
  }

  /**
   * Creates a new instance of the FetchQuizGenerationTaskForUserUseCase
   */
  createFetchTaskUseCase(): FetchQuizGenerationTaskForUserUseCase {
    return new FetchQuizGenerationTaskForUserUseCase(
      this.userRepository,
      this.quizGenerationTaskRepository,
    );
  }

  /**
   * Creates a new instance of the FetchQuizGenerationTasksForUserUseCase
   */
  createFetchTasksUseCase(): FetchQuizGenerationTasksForUserUseCase {
    return new FetchQuizGenerationTasksForUserUseCase(
      this.userRepository,
      this.quizGenerationTaskRepository,
    );
  }

  /**
   * Creates a new instance of the SoftDeleteQuizGenerationTaskForUserUseCase
   */
  createDeleteTaskUseCase(): SoftDeleteQuizGenerationTaskForUserUseCase {
    return new SoftDeleteQuizGenerationTaskForUserUseCase(
      this.userRepository,
      this.quizGenerationTaskRepository,
      this.questionRepository,
      this.answerRepository,
    );
  }

  /**
   * Creates a new instance of the ResumeQuizGenerationTaskAfterUploadUseCase
   * @throws Error if OCR service is not provided
   */
  createResumeTaskAfterUploadUseCase(): ResumeQuizGenerationTaskAfterUploadUseCase {
    if (!this.ocrService) {
      throw new Error('OCR service is required to resume a task after upload');
    }

    if (!this.fileRepository) {
      throw new Error(
        'File repository is required to resume a task after upload',
      );
    }

    // First create the CreateQuizGenerationTaskUseCase that will be used by ResumeQuizGenerationTaskAfterUploadUseCase
    const createQuizGenerationTaskUseCase = this.createCreateTaskUseCase();

    // Then create the ResumeQuizGenerationTaskAfterUploadUseCase with the correct constructor parameters
    return new ResumeQuizGenerationTaskAfterUploadUseCase(
      this.ocrService,
      this.quizGenerationTaskRepository,
      this.fileRepository,
      createQuizGenerationTaskUseCase,
    );
  }
}
