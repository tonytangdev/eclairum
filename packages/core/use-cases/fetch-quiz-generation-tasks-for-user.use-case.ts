import { User } from "../entities/user";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import { UserNotFoundError } from "../errors/quiz-errors";

type FetchQuizGenerationTasksForUserInput = {
  userId: User["id"];
};

type FetchQuizGenerationTasksForUserOutput = {
  tasks: QuizGenerationTask[];
};

export class FetchQuizGenerationTasksForUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
  ) {}

  async execute({
    userId,
  }: FetchQuizGenerationTasksForUserInput): Promise<FetchQuizGenerationTasksForUserOutput> {
    await this.validateUser(userId);

    const tasks = await this.quizGenerationTaskRepository.findByUserId(userId);

    return { tasks };
  }

  private async validateUser(userId: User["id"]): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found`);
    }
  }
}
