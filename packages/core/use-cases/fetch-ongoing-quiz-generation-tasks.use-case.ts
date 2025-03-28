import { User } from "../entities/user";
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from "../entities/quiz-generation-task";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import { UserNotFoundError } from "../errors/quiz-errors";

type FetchOngoingQuizGenerationTasksInput = {
  userId: User["id"];
};

type FetchOngoingQuizGenerationTasksOutput = {
  tasks: QuizGenerationTask[];
};

/**
 * Use case for fetching quiz generation tasks that are currently in progress or pending for a user
 */
export class FetchOngoingQuizGenerationTasksUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
  ) {}

  async execute({
    userId,
  }: FetchOngoingQuizGenerationTasksInput): Promise<FetchOngoingQuizGenerationTasksOutput> {
    await this.validateUser(userId);

    // Fetch tasks with specific statuses (PENDING or IN_PROGRESS)
    const tasks =
      await this.quizGenerationTaskRepository.findByUserIdAndStatuses(userId, [
        QuizGenerationStatus.PENDING,
        QuizGenerationStatus.IN_PROGRESS,
      ]);

    return { tasks };
  }

  private async validateUser(userId: User["id"]): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found`);
    }
  }
}
