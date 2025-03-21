import { Injectable } from '@nestjs/common';
import { FetchQuestionsForUserUseCase } from '@eclairum/core/use-cases';
import { QuestionRepositoryImpl } from '../../repositories/questions/question.repository';
import { UserRepositoryImpl } from '../../repositories/users/user.repository';
import { UserAnswerRepositoryImpl } from '../../repositories/user-answers/user-answer.repository';

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
