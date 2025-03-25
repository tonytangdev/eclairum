import {
  CreateQuizGenerationTaskUseCase,
  FetchQuizGenerationTaskForUserUseCase,
  FetchQuizGenerationTasksForUserUseCase,
  SoftDeleteQuizGenerationTaskForUserUseCase,
} from '@eclairum/core/use-cases';
import { LLMService } from '@eclairum/core/interfaces/llm-service.interface';
import { QuestionRepositoryImpl } from '../../repositories/questions/question.repository';
import { QuizGenerationTaskRepositoryImpl } from '../../repositories/quiz-generation-tasks/quiz-generation-task.repository';
import { UserRepositoryImpl } from '../../repositories/users/user.repository';
import { AnswerRepositoryImpl } from '../../repositories/answers/answer.repository';
import { FileUploadService } from '@eclairum/core/interfaces';

export class QuizGenerationTaskUseCaseFactory {
  constructor(
    private readonly llmService: LLMService,
    private readonly questionRepository: QuestionRepositoryImpl,
    private readonly answerRepository: AnswerRepositoryImpl,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepositoryImpl,
    private readonly userRepository: UserRepositoryImpl,
    private readonly fileUploadService?: FileUploadService,
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
}
