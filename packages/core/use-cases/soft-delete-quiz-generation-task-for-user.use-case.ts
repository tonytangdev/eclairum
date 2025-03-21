import { User } from "../entities/user";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import {
  UserNotFoundError,
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
} from "../errors/quiz-errors";

type SoftDeleteQuizGenerationTaskForUserInput = {
  userId: User["id"];
  taskId: QuizGenerationTask["id"];
};

type SoftDeleteQuizGenerationTaskForUserOutput = {
  success: boolean;
};

export class SoftDeleteQuizGenerationTaskForUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly answerRepository: AnswerRepository,
  ) {}

  async execute({
    userId,
    taskId,
  }: SoftDeleteQuizGenerationTaskForUserInput): Promise<SoftDeleteQuizGenerationTaskForUserOutput> {
    await this.validateUser(userId);
    const task = await this.validateTaskOwnership(userId, taskId);

    // Soft delete related entities first (children before parent)
    await this.softDeleteRelatedEntities(task);

    // Then soft delete the task itself
    await this.quizGenerationTaskRepository.softDelete(taskId);

    return { success: true };
  }

  private async validateUser(userId: User["id"]): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found`);
    }
  }

  private async validateTaskOwnership(
    userId: User["id"],
    taskId: QuizGenerationTask["id"],
  ): Promise<QuizGenerationTask> {
    const task = await this.quizGenerationTaskRepository.findById(taskId);

    if (!task) {
      throw new TaskNotFoundError(
        `Quiz generation task with id ${taskId} not found`,
      );
    }

    if (task.getUserId() !== userId) {
      throw new UnauthorizedTaskAccessError(
        `Quiz generation task with id ${taskId} does not belong to user with id ${userId}`,
      );
    }

    return task;
  }

  private async softDeleteRelatedEntities(
    task: QuizGenerationTask,
  ): Promise<void> {
    // Get all questions for this task
    const questions = task.getQuestions();

    // Soft delete all answers related to these questions
    for (const question of questions) {
      await this.answerRepository.softDeleteByQuestionId(question.getId());
    }

    // Soft delete all questions for this task
    await this.questionRepository.softDeleteByTaskId(task.getId());
  }
}
