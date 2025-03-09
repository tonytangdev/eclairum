import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreateQuizGenerationTaskDto } from '../dto/create-quiz-generation-task.dto';
import {
  Question,
  Answer,
  QuizGenerationTask,
  QuizGenerationStatus,
} from '@flash-me/core/entities';
import { QuestionRepositoryImpl } from '../../questions/infrastructure/relational/repositories/question.repository';
import { AnswerRepositoryImpl } from '../../answers/infrastructure/relational/repositories/answer.repository';
import { QuizGenerationTaskRepositoryImpl } from '../infrastructure/relational/repositories/quiz-generation-task.repository';
import {
  QuestionAnswerPair,
  QuestionGenerationService,
} from './question-generation.service';
import { QuizEntityFactory } from '../factories/quiz-entity.factory';
import { TransactionHelper } from '../../shared/helpers/transaction.helper';

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
    private readonly questionGenerationService: QuestionGenerationService,
    private readonly quizEntityFactory: QuizEntityFactory,
    private readonly transactionHelper: TransactionHelper,
  ) {}

  async createTask(
    createQuizGenerationTaskDto: CreateQuizGenerationTaskDto,
  ): Promise<TaskResponse> {
    const { text, userId } = createQuizGenerationTaskDto;

    try {
      const quizGenerationTask = this.quizEntityFactory.createTask(text);
      const taskId = quizGenerationTask.getId();
      this.logTaskCreation(taskId, userId, text);

      return await this.transactionHelper.executeInTransaction(
        (entityManager) =>
          this.processTaskWithinTransaction(
            quizGenerationTask,
            text,
            userId,
            entityManager,
          ),
      );
    } catch (error) {
      this.logError('Failed to create quiz generation task', error);
      throw error;
    }
  }

  async getTaskById(taskId: string): Promise<QuizGenerationTask | null> {
    return this.quizGenerationTaskRepository.findById(taskId);
  }

  private logTaskCreation(taskId: string, userId: string, text: string): void {
    this.logger.log(
      `Creating quiz generation task ${taskId} for user ${userId}`,
    );
    this.logger.debug(`Text length: ${text.length} characters`);
  }

  private async processTaskWithinTransaction(
    quizGenerationTask: QuizGenerationTask,
    text: string,
    userId: string,
    entityManager: EntityManager,
  ): Promise<TaskResponse> {
    await this.saveInitialTask(quizGenerationTask, entityManager);
    const questions = await this.generateAndSaveQuestions(text, entityManager);
    await this.finalizeTask(quizGenerationTask, questions, entityManager);
    return this.createTaskResponse(quizGenerationTask, userId);
  }

  private async saveInitialTask(
    task: QuizGenerationTask,
    entityManager: EntityManager,
  ): Promise<void> {
    await this.quizGenerationTaskRepository.save(task, entityManager);
  }

  private async generateAndSaveQuestions(
    text: string,
    entityManager: EntityManager,
  ): Promise<Question[]> {
    const questionAnswerPairs =
      await this.questionGenerationService.generateQuestionsFromText(text);
    return this.saveQuestionsAndAnswers(questionAnswerPairs, entityManager);
  }

  private async finalizeTask(
    task: QuizGenerationTask,
    questions: Question[],
    entityManager: EntityManager,
  ): Promise<void> {
    this.quizEntityFactory.addQuestionsToTask(task, questions);
    task.updateStatus(QuizGenerationStatus.COMPLETED);
    await this.quizGenerationTaskRepository.save(task, entityManager);
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

  private async saveQuestionsAndAnswers(
    questionAnswerPairs: QuestionAnswerPair[],
    entityManager?: EntityManager,
  ): Promise<Question[]> {
    const questions =
      this.quizEntityFactory.createQuestionEntities(questionAnswerPairs);
    const allAnswers = this.quizEntityFactory.extractAllAnswers(questions);
    await this.persistEntities(questions, allAnswers, entityManager);
    return questions;
  }

  private async persistEntities(
    questions: Question[],
    answers: Answer[],
    entityManager?: EntityManager,
  ): Promise<void> {
    await this.questionRepository.saveQuestions(questions, entityManager);
    await this.answerRepository.saveAnswers(answers, entityManager);
  }

  private logError(message: string, error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`${message}: ${error.message}`, error.stack);
    }
  }
}
