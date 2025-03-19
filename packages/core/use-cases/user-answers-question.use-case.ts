import { UserAnswer } from "../entities/user-answer";
import { Answer } from "../entities/answer";
import { UserRepository } from "../interfaces/user-repository.interface";
import { UserAnswersRepository } from "../interfaces/user-answers-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import {
  InvalidAnswerError,
  UserAnswerStorageError,
} from "../errors/user-answer-errors";
import { UserNotFoundError } from "../errors/quiz-errors";

type UserAnswersQuestionRequest = {
  userId: string;
  questionId: string;
  answerId: string;
};

export class UserAnswersQuestionUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userAnswersRepository: UserAnswersRepository,
    private readonly answerRepository: AnswerRepository,
  ) {}

  async execute({
    userId,
    questionId,
    answerId,
  }: UserAnswersQuestionRequest): Promise<void> {
    await this.ensureUserExists(userId);

    const answer = await this.fetchAnswer(answerId);

    this.ensureAnswerBelongsToQuestion(questionId, answer);

    const userAnswer = new UserAnswer({ userId, questionId, answer });
    await this.persistUserAnswer(userAnswer);
  }

  private async fetchAnswer(answerId: string): Promise<Answer> {
    const answer = await this.answerRepository.findById(answerId);

    if (!answer) {
      throw new InvalidAnswerError(`Answer with ID ${answerId} not found`);
    }

    return answer;
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

  private async persistUserAnswer(userAnswer: UserAnswer): Promise<void> {
    try {
      await this.userAnswersRepository.save(userAnswer);
    } catch (error) {
      throw new UserAnswerStorageError(
        "Failed to save user answer",
        error as Error,
      );
    }
  }
}
