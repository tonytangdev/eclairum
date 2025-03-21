import { User } from "../entities/user";
import { Question } from "../entities/question";
import { Answer } from "../entities/answer";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import { UserRepository } from "../interfaces/user-repository.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import {
  UserNotFoundError,
  TaskNotFoundError,
  UnauthorizedTaskAccessError,
  InvalidQuestionError,
} from "../errors/quiz-errors";

type AnswerData = {
  content: string;
  isCorrect: boolean;
};

type UserAddsQuestionRequest = {
  userId: User["id"];
  taskId: QuizGenerationTask["id"];
  questionContent: string;
  answers: AnswerData[];
};

type UserAddsQuestionResponse = {
  question: Question;
};

export class UserAddsQuestionUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly answerRepository: AnswerRepository,
  ) {}

  async execute({
    userId,
    taskId,
    questionContent,
    answers,
  }: UserAddsQuestionRequest): Promise<UserAddsQuestionResponse> {
    await this.validateUser(userId);
    const task = await this.validateTaskOwnership(userId, taskId);
    this.validateQuestionData(questionContent, answers);

    const question = this.createQuestion(questionContent, taskId);
    const answerEntities = this.createAnswers(answers, question.getId());

    await this.saveQuestionAndAnswers(question, answerEntities);
    await this.updateTask(task, question);

    return { question };
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

  private validateQuestionData(
    questionContent: string,
    answers: AnswerData[],
  ): void {
    if (!questionContent.trim()) {
      throw new InvalidQuestionError("Question content cannot be empty");
    }

    if (answers.length < 2) {
      throw new InvalidQuestionError("At least two answers are required");
    }

    const hasCorrectAnswer = answers.some((answer) => answer.isCorrect);
    if (!hasCorrectAnswer) {
      throw new InvalidQuestionError("At least one answer must be correct");
    }

    const allAnswersHaveContent = answers.every(
      (answer) => answer.content && answer.content.trim().length > 0,
    );
    if (!allAnswersHaveContent) {
      throw new InvalidQuestionError("All answers must have content");
    }
  }

  private createQuestion(
    content: string,
    taskId: QuizGenerationTask["id"],
  ): Question {
    return new Question({
      content,
      quizGenerationTaskId: taskId,
      answers: [],
    });
  }

  private createAnswers(
    answersData: AnswerData[],
    questionId: Question["id"],
  ): Answer[] {
    return answersData.map(
      (answerData) =>
        new Answer({
          content: answerData.content,
          isCorrect: answerData.isCorrect,
          questionId,
        }),
    );
  }

  private async saveQuestionAndAnswers(
    question: Question,
    answers: Answer[],
  ): Promise<void> {
    await this.questionRepository.save(question);
    await this.answerRepository.saveAnswers(answers);
  }

  private async updateTask(
    task: QuizGenerationTask,
    question: Question,
  ): Promise<void> {
    task.addQuestion(question);
    await this.quizGenerationTaskRepository.saveTask(task);
  }
}
