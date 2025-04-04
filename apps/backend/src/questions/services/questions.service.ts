import { Injectable } from '@nestjs/common';
import {
  FetchQuestionsForUserUseCase,
  UserAddsQuestionUseCase,
  UserEditsQuestionUseCase, // Import the new use case
} from '@eclairum/core/use-cases';
import { QuestionRepositoryImpl } from '../../repositories/questions/question.repository';
import { UserRepositoryImpl } from '../../repositories/users/user.repository';
import { UserAnswerRepositoryImpl } from '../../repositories/user-answers/user-answer.repository';
import { AnswerRepositoryImpl } from '../../repositories/answers/answer.repository';
import { QuizGenerationTaskRepositoryImpl } from '../../repositories/quiz-generation-tasks/quiz-generation-task.repository';
import { QuizGenerationTask } from '@eclairum/core/entities';

interface AnswerData {
  content: string;
  isCorrect: boolean;
}

@Injectable()
export class QuestionsService {
  constructor(
    private readonly questionRepository: QuestionRepositoryImpl,
    private readonly userRepository: UserRepositoryImpl,
    private readonly userAnswerRepository: UserAnswerRepositoryImpl,
    private readonly answerRepository: AnswerRepositoryImpl,
    private readonly quizGenerationTaskRepository: QuizGenerationTaskRepositoryImpl,
  ) {}

  async getQuestions(
    userId: string,
    limit: number = 3,
    quizGenerationTaskId?: QuizGenerationTask['id'],
  ) {
    const fetchQuestionsUseCase = new FetchQuestionsForUserUseCase(
      this.userRepository,
      this.questionRepository,
      this.userAnswerRepository,
    );

    try {
      const result = await fetchQuestionsUseCase.execute({
        userId,
        limit,
        quizGenerationTaskId,
      });

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

  async addQuestion(
    userId: string,
    taskId: string,
    questionContent: string,
    answers: AnswerData[],
  ) {
    const addQuestionUseCase = new UserAddsQuestionUseCase(
      this.userRepository,
      this.quizGenerationTaskRepository,
      this.questionRepository,
      this.answerRepository,
    );

    try {
      const result = await addQuestionUseCase.execute({
        userId,
        taskId,
        questionContent,
        answers,
      });

      return {
        data: result.question,
        metadata: {
          questionId: result.question.getId(),
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

  async editQuestion(
    userId: string,
    questionId: string,
    questionContent: string,
  ) {
    const editQuestionUseCase = new UserEditsQuestionUseCase(
      this.userRepository,
      this.questionRepository,
      this.quizGenerationTaskRepository,
    );

    try {
      const result = await editQuestionUseCase.execute({
        userId,
        questionId,
        questionContent,
      });

      return {
        data: result.question,
        metadata: {
          questionId: result.question.getId(),
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
