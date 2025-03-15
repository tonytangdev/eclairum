import { User } from "../entities/user";
import { Question } from "../entities/question";
import { UserAnswersRepository } from "../interfaces/user-answers-repository.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import { UserNotFoundError } from "../errors/quiz-errors";
import { QuestionSelector } from "../services/question-selector.service";

type FetchQuestionsForUserInput = {
  userId: User["id"];
  limit?: number;
};

type FetchQuestionsForUserOutput = {
  questions: Question[];
};

export class FetchQuestionsForUserUseCase {
  private readonly questionSelector: QuestionSelector;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly userAnswersRepository: UserAnswersRepository,
  ) {
    this.questionSelector = new QuestionSelector();
  }

  async execute({
    userId,
    limit = 3,
  }: FetchQuestionsForUserInput): Promise<FetchQuestionsForUserOutput> {
    await this.validateUser(userId);

    if (limit <= 0) {
      return { questions: [] };
    }

    const allQuestions = await this.questionRepository.findAll();
    if (allQuestions.length === 0) {
      return { questions: [] };
    }

    const questionFrequencies =
      await this.userAnswersRepository.findQuestionAnswerFrequencies(userId);

    const selectedQuestions =
      this.questionSelector.selectQuestionsWithFrequencies(
        allQuestions,
        questionFrequencies,
        limit,
      );

    return { questions: selectedQuestions };
  }

  private async validateUser(userId: User["id"]): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found`);
    }
  }
}
