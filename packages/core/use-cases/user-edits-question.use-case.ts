import { User } from "../entities/user";
import { Question } from "../entities/question";
import { UserRepository } from "../interfaces/user-repository.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import {
  UserNotFoundError,
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
  InvalidQuestionError,
} from "../errors/quiz-errors";

type UserEditsQuestionRequest = {
  userId: User["id"];
  questionId: Question["id"];
  questionContent: string;
};

type UserEditsQuestionResponse = {
  question: Question;
};

export class UserEditsQuestionUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
  ) {}

  async execute({
    userId,
    questionId,
    questionContent,
  }: UserEditsQuestionRequest): Promise<UserEditsQuestionResponse> {
    await this.validateUser(userId);
    const question = await this.findAndValidateQuestion(questionId);
    await this.validateUserOwnsQuestion(userId, question);
    this.validateQuestionContent(questionContent);

    // Update question content
    question.setContent(questionContent);
    await this.questionRepository.save(question);

    return { question };
  }

  private async validateUser(userId: User["id"]): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found`);
    }
  }

  private async findAndValidateQuestion(
    questionId: Question["id"],
  ): Promise<Question> {
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new InvalidQuestionError(
        `Question with id ${questionId} not found`,
      );
    }
    return question;
  }

  private async validateUserOwnsQuestion(
    userId: User["id"],
    question: Question,
  ): Promise<void> {
    const taskId = question.getQuizGenerationTaskId();
    const task = await this.quizGenerationTaskRepository.findById(taskId);

    if (!task) {
      throw new TaskNotFoundError(`Task with id ${taskId} not found`);
    }

    if (task.getUserId() !== userId) {
      throw new UnauthorizedTaskAccessError(
        `Question with id ${question.getId()} does not belong to user with id ${userId}`,
      );
    }
  }

  private validateQuestionContent(questionContent: string): void {
    if (!questionContent.trim()) {
      throw new InvalidQuestionError("Question content cannot be empty");
    }
  }
}
