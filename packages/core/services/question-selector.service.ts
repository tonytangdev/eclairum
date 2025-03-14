import { Question } from "../entities/question";
import { UserAnswer } from "../entities/user_answer";

export class QuestionSelector {
  constructor() {}
  selectQuestions(
    allQuestions: Question[],
    userAnswers: UserAnswer[],
    limit: number,
  ): Question[] {
    const unansweredQuestions = this.getUnansweredQuestions(
      allQuestions,
      userAnswers,
    );

    if (unansweredQuestions.length >= limit) {
      return this.selectRandomQuestions(unansweredQuestions, limit);
    }

    if (unansweredQuestions.length > 0) {
      return this.combineUnansweredAndLeastAnsweredQuestions(
        unansweredQuestions,
        allQuestions,
        userAnswers,
        limit,
      );
    }

    return this.getLeastFrequentlyAnsweredQuestions(
      allQuestions,
      userAnswers,
      limit,
    );
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

  private getLeastFrequentlyAnsweredQuestions(
    questions: Question[],
    userAnswers: UserAnswer[],
    limit: number,
  ): Question[] {
    const sortedQuestions = this.sortQuestionsByAnswerFrequency(
      questions,
      userAnswers,
    );
    return sortedQuestions.slice(0, limit);
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
