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
import {
  LLMServiceError,
  NoQuestionsGeneratedError,
  QuizStorageError,
} from "../errors/quiz-errors";

type CreateQuizGenerationTaskUseCaseRequest = {
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
  ) {}

  async execute({
    text,
  }: CreateQuizGenerationTaskUseCaseRequest): Promise<CreateQuizGenerationTaskUseCaseResponse> {
    // Create a new quiz generation task
    const quizGenerationTask = new QuizGenerationTask({
      textContent: text,
      questions: [],
      status: QuizGenerationStatus.IN_PROGRESS,
    });

    try {
      // Generate quiz questions using LLM service
      const questions = await this.generateQuizUsingLLM(text);

      // Add questions to the task
      questions.forEach((question) => {
        quizGenerationTask.addQuestion(question);
      });

      // Mark the task as completed
      quizGenerationTask.updateStatus(QuizGenerationStatus.COMPLETED);

      // Save the questions and answers using repositories
      await this.saveQuizData(quizGenerationTask, questions);

      return {
        quizGenerationTask,
      };
    } catch (error) {
      // If there's an error, mark the task as failed
      quizGenerationTask.updateStatus(QuizGenerationStatus.FAILED);

      // Still try to save the task with the failed status
      try {
        await this.saveFailedQuizTask(quizGenerationTask);
      } catch (saveError) {
        console.error("Failed to save failed quiz generation task:", saveError);
      }

      // Re-throw the error
      throw error;
    }
  }

  private async generateQuizUsingLLM(text: string): Promise<Question[]> {
    let llmQuestions: QuizQuestion[];
    try {
      llmQuestions = await this.llmService.generateQuiz(text);
    } catch (error) {
      throw new LLMServiceError(
        `Failed to generate quiz questions: ${(error as Error).message}`,
        error as Error,
      );
    }

    // Check if we have any questions
    if (!llmQuestions || llmQuestions.length === 0) {
      throw new NoQuestionsGeneratedError(text);
    }

    // Convert LLM questions to domain entities
    return llmQuestions.map((llmQuestion) => {
      const question = new Question({
        content: llmQuestion.question,
        answers: [],
      });

      // Create answer entities for each answer
      const answers = llmQuestion.answers.map((llmAnswer) => {
        return new Answer({
          content: llmAnswer.text,
          isCorrect: llmAnswer.isCorrect,
          questionId: question.getId(),
        });
      });

      // Add answers to the question
      answers.forEach((answer) => {
        question.addAnswer(answer);
      });
      return question;
    });
  }

  /**
   * Save all quiz data in a specific order:
   * 1. Save the quiz generation task
   * 2. Save the questions
   * 3. Save the answers
   */
  private async saveQuizData(
    quizGenerationTask: QuizGenerationTask,
    questions: Question[],
  ): Promise<void> {
    try {
      // 1. First, save the quiz generation task
      await this.quizGenerationTaskRepository.saveTask(quizGenerationTask);

      // 2. Then, save the questions
      await this.questionRepository.saveQuestions(questions);

      // 3. Finally, save the answers
      const answers = questions.flatMap((question) => question.getAnswers());
      await this.answerRepository.saveAnswers(answers);
    } catch (error) {
      throw new QuizStorageError(
        `Failed to save quiz generation task: ${(error as Error).message}`,
        error as Error,
      );
    }
  }

  /**
   * Save a failed quiz generation task and its questions, if any
   */
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
