import { Injectable } from '@nestjs/common';
import { FetchQuestionsForUserUseCase } from '@flash-me/core/use-cases';
import { QuestionRepositoryImpl } from '../infrastructure/relational/repositories/question.repository';
import { UserRepositoryImpl } from '../../users/infrastructure/relational/user.repository';
import { UserAnswerRepositoryImpl } from '../../user-answers/infrastructure/relational/repositories/user-answer.repository';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly questionRepository: QuestionRepositoryImpl,
    private readonly userRepository: UserRepositoryImpl,
    private readonly userAnswerRepository: UserAnswerRepositoryImpl,
  ) {}

  async getQuestions(userId: string, limit: number = 3) {
    const fetchQuestionsUseCase = new FetchQuestionsForUserUseCase(
      this.userRepository,
      this.questionRepository,
      this.userAnswerRepository,
    );

    try {
      const result = await fetchQuestionsUseCase.execute({ userId, limit });

      return {
        data: result.questions,
        metadata: {
          count: result.questions.length,
        },
        success: true,
      };
    } catch (error) {
      return {
        data: [],
        metadata: {
          count: 0,
          error: (error as Error).message,
        },
        success: false,
      };
    }
  }
}
