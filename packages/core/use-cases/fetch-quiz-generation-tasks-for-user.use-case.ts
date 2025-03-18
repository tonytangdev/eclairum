import { User } from "../entities/user";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import { UserNotFoundError } from "../errors/quiz-errors";
import {
  PaginationParams,
  PaginationMeta,
} from "../shared/pagination.interface";

type FetchQuizGenerationTasksForUserInput = {
  userId: User["id"];
  pagination?: PaginationParams;
};

type FetchQuizGenerationTasksForUserOutput = {
  tasks: QuizGenerationTask[];
  pagination?: PaginationMeta;
};

export class FetchQuizGenerationTasksForUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
  ) {}

  async execute({
    userId,
    pagination = { page: 1, limit: 10 },
  }: FetchQuizGenerationTasksForUserInput): Promise<FetchQuizGenerationTasksForUserOutput> {
    await this.validateUser(userId);

    // Ensure valid pagination parameters
    const page = Math.max(1, pagination.page);
    const limit = Math.max(1, Math.min(100, pagination.limit)); // Limit between 1 and 100
    const result =
      await this.quizGenerationTaskRepository.findByUserIdPaginated(userId, {
        page,
        limit,
      });

    return {
      tasks: result.data,
      pagination: result.meta,
    };
  }

  private async validateUser(userId: User["id"]): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found`);
    }
  }
}
