export interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  question: string;
  answers: Answer[];
}

export interface LLMService {
  generateQuiz(text: string): Promise<QuizQuestion[]>;
}
