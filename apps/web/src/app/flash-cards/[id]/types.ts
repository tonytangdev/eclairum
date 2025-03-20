export enum QuizGenerationStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

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
  generatedAt: Date;
  userId: string;
  title: string;
  category: string;
}
