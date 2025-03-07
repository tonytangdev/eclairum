import { QuizGenerationTask } from "../entities/quiz-generation-task";

export interface QuizGenerationTaskRepository {
  saveTask(task: QuizGenerationTask): Promise<void>;
}
