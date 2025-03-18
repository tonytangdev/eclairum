export interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  question: string;
  answers: Answer[];
}

export interface GenerateQuizResponse {
  questions: QuizQuestion[];
  title: string;
}

export interface LLMService {
  generateQuiz(text: string): Promise<GenerateQuizResponse>;
}
