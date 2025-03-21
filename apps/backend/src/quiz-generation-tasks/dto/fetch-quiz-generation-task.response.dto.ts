/**
 * Response DTO for a single quiz generation task with detailed information
 */
export interface TaskDetailResponse {
  id: string;
  status: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  generatedAt: Date | null;
  textContent: string;
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
