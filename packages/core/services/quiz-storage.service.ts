import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import { Question } from "../entities/question";
import { QuizStorageError } from "../errors/quiz-errors";

export class QuizStorageService {
  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly answerRepository: AnswerRepository,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
  ) {}

  async saveTask(quizGenerationTask: QuizGenerationTask): Promise<void> {
    await this.quizGenerationTaskRepository.saveTask(quizGenerationTask);
  }

  async saveQuizData(
    quizGenerationTask: QuizGenerationTask,
    questions: Question[],
  ): Promise<void> {
    try {
      await this.quizGenerationTaskRepository.saveTask(quizGenerationTask);
      await this.questionRepository.saveQuestions(questions);
      await this.saveAnswers(questions);
    } catch (error) {
      throw new QuizStorageError(
        `Failed to save quiz generation task: ${(error as Error).message}`,
        error as Error,
      );
    }
  }

  async saveFailedTask(quizGenerationTask: QuizGenerationTask): Promise<void> {
    await this.quizGenerationTaskRepository.saveTask(quizGenerationTask);

    const questions = quizGenerationTask.getQuestions();
    if (questions.length > 0) {
      await this.questionRepository.saveQuestions(questions);
    }
  }

  private async saveAnswers(questions: Question[]): Promise<void> {
    const answers = questions.flatMap((question) => question.getAnswers());
    await this.answerRepository.saveAnswers(answers);
  }
}
