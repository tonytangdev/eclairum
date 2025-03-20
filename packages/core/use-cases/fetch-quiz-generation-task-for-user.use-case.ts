import { User } from "../entities/user";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import {
  UserNotFoundError,
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
} from "../errors/quiz-errors";

type FetchQuizGenerationTaskForUserInput = {
  userId: User["id"];
  taskId: QuizGenerationTask["id"];
};

type FetchQuizGenerationTaskForUserOutput = {
  task: QuizGenerationTask;
};

export class FetchQuizGenerationTaskForUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
  ) {}

  async execute({
    userId,
    taskId,
  }: FetchQuizGenerationTaskForUserInput): Promise<FetchQuizGenerationTaskForUserOutput> {
    await this.validateUser(userId);

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

    return {
      task,
    };
  }

  private async validateUser(userId: User["id"]): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found`);
    }
  }
}
