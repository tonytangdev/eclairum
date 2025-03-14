import { Injectable } from '@nestjs/common';
import { QuestionRepositoryImpl } from '../infrastructure/relational/repositories/question.repository';

@Injectable()
export class QuestionsService {
  constructor(private readonly questionRepository: QuestionRepositoryImpl) {}

  getQuestions() {
    // For now, return empty list
    return {
      data: [],
      metadata: {
        count: 0,
      },
      success: true,
    };
  }
}
