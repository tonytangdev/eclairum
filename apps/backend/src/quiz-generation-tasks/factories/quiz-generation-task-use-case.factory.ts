import {
  CreateQuizGenerationTaskUseCase,
  FetchQuizGenerationTaskForUserUseCase,
  FetchQuizGenerationTasksForUserUseCase,
  SoftDeleteQuizGenerationTaskForUserUseCase,
} from '@eclairum/core/use-cases';
import { Injectable } from '@nestjs/common';
import { LLMService } from '@eclairum/core/interfaces/llm-service.interface';
import { QuestionRepositoryImpl } from '../../questions/infrastructure/relational/repositories/question.repository';
import { AnswerRepositoryImpl } from '../../answers/infrastructure/relational/repositories/answer.repository';
import { QuizGenerationTaskRepositoryImpl } from '../infrastructure/relational/repositories/quiz-generation-task.repository';
import { UserRepositoryImpl } from '../../users/infrastructure/relational/user.repository';

@Injectable()
export class QuizGenerationTaskUseCaseFactory {
  constructor(
    private readonly llmService: LLMService,
    private readonly questionRepository: QuestionRepositoryImpl,
    private readonly answerRepository: AnswerRepositoryImpl,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepositoryImpl,
    private readonly userRepository: UserRepositoryImpl,
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
