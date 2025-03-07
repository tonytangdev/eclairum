import { QuizQuestion } from "./llm-service.interface";
import { QuizGenerationTask } from "../entities/quiz-generation-task";

export interface QuizService {
  saveQuestions(questions: QuizQuestion[]): Promise<void>;
  saveQuizGenerationTask(quizGenerationTask: QuizGenerationTask): Promise<void>;
}
