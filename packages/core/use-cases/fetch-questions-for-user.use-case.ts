import { User } from "../entities/user";
import { Question } from "../entities/question";
import { UserAnswersRepository } from "../interfaces/user-answers-repository.interface";
import { QuestionRepository } from "../interfaces/question-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import { UserNotFoundError } from "../errors/quiz-errors";
import { UserAnswer } from "../entities";

type FetchQuestionsForUserInput = {
  userId: User["id"];
  limit?: number;
};

type FetchQuestionsForUserOutput = {
  questions: Question[];
};

export class FetchQuestionsForUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private questionRepository: QuestionRepository,
    private userAnswersRepository: UserAnswersRepository,
  ) {}

  async execute({
    userId,
    limit = 3,
  }: FetchQuestionsForUserInput): Promise<FetchQuestionsForUserOutput> {
    await this.validateUser(userId);

    const allQuestions = await this.questionRepository.findAll();
    if (allQuestions.length === 0 || limit <= 0) {
      return { questions: [] };
    }

    const userAnswers = await this.userAnswersRepository.findByUserId(userId);
    const unansweredQuestions = this.getUnansweredQuestions(
      allQuestions,
      userAnswers,
    );

    if (unansweredQuestions.length >= limit) {
      return {
        questions: this.selectRandomQuestions(unansweredQuestions, limit),
      };
    }

    if (unansweredQuestions.length > 0) {
      return {
        questions: this.combineUnansweredAndLeastAnsweredQuestions(
          unansweredQuestions,
          allQuestions,
          userAnswers,
          limit,
        ),
      };
    }

    const questionsOrderedByFrequency = this.sortQuestionsByAnswerFrequency(
      allQuestions,
      userAnswers,
    );

    return {
      questions: questionsOrderedByFrequency.slice(0, limit),
    };
  }

  private async validateUser(userId: User["id"]): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with id ${userId} not found`);
    }
  }

  private getUnansweredQuestions(
    allQuestions: Question[],
    userAnswers: UserAnswer[],
  ): Question[] {
    const answeredQuestionIds = new Set(
      userAnswers.map((userAnswer) => userAnswer.getQuestionId()),
    );

    return allQuestions.filter(
      (question) => !answeredQuestionIds.has(question.getId()),
    );
  }

  private combineUnansweredAndLeastAnsweredQuestions(
    unansweredQuestions: Question[],
    allQuestions: Question[],
    userAnswers: UserAnswer[],
    limit: number,
  ): Question[] {
    const unansweredIds = new Set(unansweredQuestions.map((q) => q.getId()));
    const answeredQuestions = allQuestions.filter(
      (q) => !unansweredIds.has(q.getId()),
    );

    const sortedAnsweredQuestions = this.sortQuestionsByAnswerFrequency(
      answeredQuestions,
      userAnswers,
    );

    const result = [...unansweredQuestions];
    const neededCount = limit - result.length;

    if (neededCount > 0 && sortedAnsweredQuestions.length > 0) {
      result.push(...sortedAnsweredQuestions.slice(0, neededCount));
    }

    return this.selectRandomQuestions(result, limit);
  }

  private sortQuestionsByAnswerFrequency(
    questions: Question[],
    userAnswers: UserAnswer[],
  ): Question[] {
    const answerFrequencyMap = this.buildAnswerFrequencyMap(
      questions,
      userAnswers,
    );

    return [...questions].sort((a, b) => {
      const countA = answerFrequencyMap.get(a.getId())!;
      const countB = answerFrequencyMap.get(b.getId())!;
      return countA - countB;
    });
  }

  private buildAnswerFrequencyMap(
    questions: Question[],
    userAnswers: UserAnswer[],
  ): Map<string, number> {
    const answerFrequencyMap = new Map<string, number>();

    questions.forEach((question) => {
      answerFrequencyMap.set(question.getId(), 0);
    });

    userAnswers.forEach((userAnswer) => {
      const questionId = userAnswer.getQuestionId();
      if (answerFrequencyMap.has(questionId)) {
        const currentCount = answerFrequencyMap.get(questionId)!;
        answerFrequencyMap.set(questionId, currentCount + 1);
      }
    });

    return answerFrequencyMap;
  }

  private selectRandomQuestions(
    questions: Question[],
    limit: number,
  ): Question[] {
    return [...questions]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(limit, questions.length));
  }
}
