import { UserAnswer } from "../entities/user_answer";
import { Answer } from "../entities/answer";
import { UserRepository } from "../interfaces/user-repository.interface";
import { UserAnswersRepository } from "../interfaces/user-answers-repository.interface";
import {
  InvalidAnswerError,
  UserAnswerStorageError,
} from "../errors/user-answer-errors";
import { UserNotFoundError } from "../errors/quiz-errors";

type UserAnswersQuestionRequest = {
  userId: string;
  questionId: string;
  answer: Answer;
};

type UserAnswersQuestionResponse = {
  userAnswer: UserAnswer;
  isCorrect: boolean;
};

export class UserAnswersQuestionUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userAnswersRepository: UserAnswersRepository,
  ) {}

  async execute({
    userId,
    questionId,
    answer,
  }: UserAnswersQuestionRequest): Promise<UserAnswersQuestionResponse> {
    await this.ensureUserExists(userId);
    this.ensureAnswerBelongsToQuestion(questionId, answer);

    const userAnswer = new UserAnswer({ userId, questionId, answer });
    const savedUserAnswer = await this.persistUserAnswer(userAnswer);

    return {
      userAnswer: savedUserAnswer,
      isCorrect: savedUserAnswer.isCorrect(),
    };
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(`User with ID ${userId} not found`);
    }
  }

  private ensureAnswerBelongsToQuestion(
    questionId: string,
    answer: Answer,
  ): void {
    if (answer.getQuestionId() !== questionId) {
      throw new InvalidAnswerError(
        `Answer does not belong to question ${questionId}`,
      );
    }
  }

  private async persistUserAnswer(userAnswer: UserAnswer): Promise<UserAnswer> {
    try {
      return await this.userAnswersRepository.save(userAnswer);
    } catch (error) {
      throw new UserAnswerStorageError(
        "Failed to save user answer",
        error as Error,
      );
    }
  }
}
