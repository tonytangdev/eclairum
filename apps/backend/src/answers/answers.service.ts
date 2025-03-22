import { Injectable } from '@nestjs/common';
import { UserEditsAnswerUseCase } from '@eclairum/core/use-cases';
import { UserRepositoryImpl } from '../repositories/users/user.repository';
import { AnswerRepositoryImpl } from '../repositories/answers/answer.repository';
import { QuizGenerationTaskRepositoryImpl } from '../repositories/quiz-generation-tasks/quiz-generation-task.repository';
import { QuestionRepositoryImpl } from '../repositories/questions/question.repository';

@Injectable()
export class AnswersService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly answerRepository: AnswerRepositoryImpl,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepositoryImpl,
    private readonly questionRepository: QuestionRepositoryImpl,
  ) {}

  async editAnswer(
    userId: string,
    answerId: string,
    answerContent: string,
    isCorrect: boolean,
  ) {
    const editAnswerUseCase = new UserEditsAnswerUseCase(
      this.userRepository,
      this.answerRepository,
      this.quizGenerationTaskRepository,
      this.questionRepository,
    );

    try {
      const result = await editAnswerUseCase.execute({
        userId,
        answerId,
        answerContent,
        isCorrect,
      });

      return {
        data: result.answer,
        metadata: {
          answerId: result.answer.getId(),
        },
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        metadata: {
          error: (error as Error).message,
        },
        success: false,
      };
    }
  }
}
