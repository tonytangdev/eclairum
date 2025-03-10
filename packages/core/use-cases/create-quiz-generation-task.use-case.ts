import {
  QuizGenerationStatus,
  QuizGenerationTask,
} from "../entities/quiz-generation-task";
import { Question } from "../entities/question";
import { Answer } from "../entities/answer";
import { LLMService, QuizQuestion } from "../interfaces/llm-service.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { AnswerRepository } from "../interfaces/answer-repository.interface";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import {
  LLMServiceError,
  NoQuestionsGeneratedError,
  QuizStorageError,
  UserNotFoundError,
  TextTooLongError,
} from "../errors/quiz-errors";
import { User } from "../entities";
import { MAX_TEXT_LENGTH } from "../constants/quiz.constants";

type CreateQuizGenerationTaskUseCaseRequest = {
  userId: User["id"];
  text: string;
};

type CreateQuizGenerationTaskUseCaseResponse = {
  quizGenerationTask: QuizGenerationTask;
};

export class CreateQuizGenerationTaskUseCase {
  constructor(
    private readonly llmService: LLMService,
    private readonly questionRepository: QuestionRepository,
    private readonly answerRepository: AnswerRepository,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute({
    userId,
    text,
  }: CreateQuizGenerationTaskUseCaseRequest): Promise<CreateQuizGenerationTaskUseCaseResponse> {
    // Check text length
    if (text.length > MAX_TEXT_LENGTH) {
      throw new TextTooLongError(
        `Text exceeds the maximum length of ${MAX_TEXT_LENGTH} characters`,
      );
    }

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with ID ${userId} not found`);
    }

    const quizGenerationTask = this.createTask(text, userId);

    try {
      const questions = await this.generateQuestions(text);
      this.addQuestionsToTask(quizGenerationTask, questions);
      quizGenerationTask.updateStatus(QuizGenerationStatus.COMPLETED);
      await this.saveQuizData(quizGenerationTask, questions);
    } catch (error) {
      await this.handleFailedTask(quizGenerationTask, error);
    }

    return { quizGenerationTask };
  }

  private createTask(text: string, userId: User["id"]): QuizGenerationTask {
    return new QuizGenerationTask({
      textContent: text,
      questions: [],
      status: QuizGenerationStatus.IN_PROGRESS,
      userId,
    });
  }

  private async generateQuestions(text: string): Promise<Question[]> {
    const llmQuestions = await this.fetchQuestionsFromLLM(text);
    this.validateLLMResponse(llmQuestions, text);
    return this.convertLLMQuestionsToEntities(llmQuestions);
  }

  private async fetchQuestionsFromLLM(text: string): Promise<QuizQuestion[]> {
    try {
      return await this.llmService.generateQuiz(text);
    } catch (error) {
      throw new LLMServiceError(
        `Failed to generate quiz questions: ${(error as Error).message}`,
        error as Error,
      );
    }
  }

  private validateLLMResponse(questions: QuizQuestion[], text: string): void {
    if (!questions || questions.length === 0) {
      throw new NoQuestionsGeneratedError(text);
    }
  }

  private convertLLMQuestionsToEntities(
    llmQuestions: QuizQuestion[],
  ): Question[] {
    return llmQuestions.map((llmQuestion) => {
      const question = new Question({
        content: llmQuestion.question,
        answers: [],
      });

      this.addAnswersToQuestion(question, llmQuestion);
      return question;
    });
  }

  private addAnswersToQuestion(
    question: Question,
    llmQuestion: QuizQuestion,
  ): void {
    const answers = llmQuestion.answers.map((llmAnswer) => {
      return new Answer({
        content: llmAnswer.text,
        isCorrect: llmAnswer.isCorrect,
        questionId: question.getId(),
      });
    });

    answers.forEach((answer) => question.addAnswer(answer));
  }

  private addQuestionsToTask(
    task: QuizGenerationTask,
    questions: Question[],
  ): void {
    questions.forEach((question) => task.addQuestion(question));
  }

  private async saveQuizData(
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

  private async saveAnswers(questions: Question[]): Promise<void> {
    const answers = questions.flatMap((question) => question.getAnswers());
    await this.answerRepository.saveAnswers(answers);
  }

  private async handleFailedTask(
    quizGenerationTask: QuizGenerationTask,
    error: unknown,
  ): Promise<void> {
    quizGenerationTask.updateStatus(QuizGenerationStatus.FAILED);

    try {
      await this.saveFailedQuizTask(quizGenerationTask);
    } catch (saveError) {
      console.error("Failed to save failed quiz generation task:", saveError);
    }

    throw error;
  }

  private async saveFailedQuizTask(
    quizGenerationTask: QuizGenerationTask,
  ): Promise<void> {
    await this.quizGenerationTaskRepository.saveTask(quizGenerationTask);

    const questions = quizGenerationTask.getQuestions();
    if (questions.length > 0) {
      await this.questionRepository.saveQuestions(questions);
    }
  }
}
