import { QuizGenerationStatus } from '@eclairum/core/entities';
import { PaginationMeta } from '@eclairum/core/shared';

export interface TaskResponse {
  taskId: string;
  userId: string;
  status: QuizGenerationStatus;
  questionsCount: number;
  message: string;
  generatedAt: Date;
}

export interface TaskSummaryResponse {
  id: string;
  status: QuizGenerationStatus;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  questionsCount: number;
}

export interface PaginatedTasksResponse {
  data: TaskSummaryResponse[];
  meta: PaginationMeta;
}

export interface TaskDetailResponse {
  id: string;
  status: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  generatedAt: Date | null;
  questions: Array<{
    id: string;
    text: string;
    answers: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
}
