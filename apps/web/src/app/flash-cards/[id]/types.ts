import { TaskDetailResponse } from "@eclairum/backend/dtos";
import { QuizGenerationStatus } from "@eclairum/core/entities";

export interface Answer {
  id: string;
  content: string;
  isCorrect: boolean;
  questionId: string;
}

export interface Question {
  id: string;
  content: string;
  answers: Answer[];
  quizGenerationTaskId: string;
}

export interface Quiz {
  id: string;
  textContent: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  status: QuizGenerationStatus;
  generatedAt: Date | null;
  userId: string;
  title: string | null;
  category: string;
}

/**
 * Maps the TaskDetailResponse from the backend to the Quiz type used in the frontend
 */
export function mapTaskResponseToQuiz(
  response: TaskDetailResponse,
  userId: string,
): Quiz {
  return {
    id: response.id,
    textContent: response.textContent,
    questions: response.questions.map((question) => ({
      id: question.id,
      content: question.text,
      answers: question.answers.map((answer) => ({
        id: answer.id,
        content: answer.text,
        isCorrect: answer.isCorrect,
        questionId: question.id,
      })),
      quizGenerationTaskId: response.id,
    })),
    createdAt: new Date(response.createdAt),
    updatedAt: new Date(response.updatedAt),
    deletedAt: null,
    status: response.status as QuizGenerationStatus,
    generatedAt: response.generatedAt ? new Date(response.generatedAt) : null,
    userId,
    title: response.title || "Untitled Quiz",
    category: "",
  };
}

export { QuizGenerationStatus };
