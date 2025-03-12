import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreateQuizGenerationTaskDto } from '../dto/create-quiz-generation-task.dto';
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from '@flash-me/core/entities';
import { QuestionRepositoryImpl } from '../../questions/infrastructure/relational/repositories/question.repository';
import { AnswerRepositoryImpl } from '../../answers/infrastructure/relational/repositories/answer.repository';
import { QuizGenerationTaskRepositoryImpl } from '../infrastructure/relational/repositories/quiz-generation-task.repository';
import { QuestionGenerationService } from './question-generation.service';
import { TransactionHelper } from '../../shared/helpers/transaction.helper';
import { CreateQuizGenerationTaskUseCase } from '@flash-me/core/use-cases';
import { LLMService } from '@flash-me/core/interfaces/llm-service.interface';
import { UserRepository } from '@flash-me/core/interfaces/user-repository.interface';
import { LLM_SERVICE_PROVIDER_KEY } from './openai-llm.service';
import { UserRepositoryImpl } from '../../users/infrastructure/relational/user.repository';

export interface TaskResponse {
  taskId: string;
  userId: string;
  status: QuizGenerationStatus;
  questionsCount: number;
  message: string;
  generatedAt: Date;
}

@Injectable()
export class QuizGenerationTasksService {
  private readonly logger = new Logger(QuizGenerationTasksService.name);

  constructor(
    private readonly questionRepository: QuestionRepositoryImpl,
    private readonly answerRepository: AnswerRepositoryImpl,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepositoryImpl,
    private readonly transactionHelper: TransactionHelper,
    @Inject(LLM_SERVICE_PROVIDER_KEY)
    private readonly llmService: LLMService,
    private readonly userRepository: UserRepositoryImpl,
  ) {}

  async createTask(
    createQuizGenerationTaskDto: CreateQuizGenerationTaskDto,
  ): Promise<TaskResponse> {
    const { text, userId } = createQuizGenerationTaskDto;

    try {
      this.logger.log(`Creating quiz generation task for user ${userId}`);
      this.logger.debug(`Text length: ${text.length} characters`);

      return await this.transactionHelper.executeInTransaction(
        async (entityManager) => {
          // Configure repositories to use the transaction context
          this.configureRepositoriesForTransaction(entityManager);

          // Create the use case instance with the configured repositories
          const createQuizGenerationTaskUseCase = this.createUseCase();

          // Execute the use case
          const { quizGenerationTask } =
            await createQuizGenerationTaskUseCase.execute({
              userId,
              text,
            });

          return this.createTaskResponse(quizGenerationTask, userId);
        },
      );
    } catch (error) {
      this.logError('Failed to create quiz generation task', error);
      throw error;
    }
  }

  private createUseCase(): CreateQuizGenerationTaskUseCase {
    return new CreateQuizGenerationTaskUseCase(
      this.llmService,
      this.questionRepository,
      this.answerRepository,
      this.quizGenerationTaskRepository,
      this.userRepository,
    );
  }

  // Configure repositories to use the current transaction context
  private configureRepositoriesForTransaction(
    entityManager: EntityManager,
  ): void {
    this.questionRepository.setEntityManager(entityManager);
    this.answerRepository.setEntityManager(entityManager);
    this.quizGenerationTaskRepository.setEntityManager(entityManager);
    // Add any other repositories that need transaction context
  }

  async getTaskById(taskId: string): Promise<QuizGenerationTask | null> {
    return this.quizGenerationTaskRepository.findById(taskId);
  }

  private createTaskResponse(
    task: QuizGenerationTask,
    userId: string,
  ): TaskResponse {
    const taskId = task.getId();
    const questionsCount = task.getQuestions().length;

    this.logger.log(
      `Successfully generated ${questionsCount} questions for task ${taskId}`,
    );

    return {
      taskId,
      userId,
      status: task.getStatus(),
      questionsCount,
      message: `Quiz generation task created with ${questionsCount} questions`,
      generatedAt: task.getGeneratedAt()!,
    };
  }

  private logError(message: string, error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`${message}: ${error.message}`, error.stack);
    }
  }
}
