import { User } from "../entities/user";
import { Answer } from "../entities/answer";
import { UserRepository } from "../interfaces/user-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import {
  UserNotFoundError,
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
} from "../errors/quiz-errors";
import { InvalidAnswerError } from "../errors";
import { QuestionRepository } from "../interfaces";

type UserEditsAnswerRequest = {
  userId: User["id"];
  answerId: Answer["id"];
  answerContent: string;
  isCorrect: boolean;
};

type UserEditsAnswerResponse = {
  answer: Answer;
};

export class UserEditsAnswerUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly answerRepository: AnswerRepository,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
    private readonly questionRepository: QuestionRepository,
  ) {}

  async execute({
    userId,
    answerId,
    answerContent,
    isCorrect,
  }: UserEditsAnswerRequest): Promise<UserEditsAnswerResponse> {
    await this.validateUser(userId);
    const answer = await this.findAndValidateAnswer(answerId);
    await this.validateUserOwnsAnswer(userId, answer);
    this.validateAnswerContent(answerContent);

    // Update answer content and correctness
    answer.setContent(answerContent);
    answer.setIsCorrect(isCorrect);
    await this.answerRepository.save(answer);

    return { answer };
  }

  private async validateUser(userId: User["id"]): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found`);
    }
  }

  private async findAndValidateAnswer(answerId: Answer["id"]): Promise<Answer> {
    const answer = await this.answerRepository.findById(answerId);
    if (!answer) {
      throw new InvalidAnswerError(`Answer with id ${answerId} not found`);
    }
    return answer;
  }

  private async validateUserOwnsAnswer(
    userId: User["id"],
    answer: Answer,
  ): Promise<void> {
    const questionId = answer.getQuestionId();
    const question = await this.questionRepository.findById(questionId);

    if (!question) {
      throw new TaskNotFoundError(`Question with id ${questionId} not found`);
    }

    const taskId = question.getQuizGenerationTaskId();
    const task = await this.quizGenerationTaskRepository.findById(taskId);

    if (!task) {
      throw new TaskNotFoundError(`Task with id ${taskId} not found`);
    }

    if (task.getUserId() !== userId) {
      throw new UnauthorizedTaskAccessError(
        `Answer with id ${answer.getId()} does not belong to user with id ${userId}`,
      );
    }
  }

  private validateAnswerContent(answerContent: string): void {
    if (!answerContent.trim()) {
      throw new InvalidAnswerError("Answer content cannot be empty");
    }
  }
}
