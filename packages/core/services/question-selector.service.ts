import { Question } from "../entities/question";
import { UserAnswer } from "../entities/user-answer";

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

  selectQuestionsWithAnsweredIds(
    questions: Question[],
    answeredQuestionIds: string[],
    limit: number,
  ): Question[] {
    // Create a Set for O(1) lookups
    const answeredQuestionsSet = new Set(answeredQuestionIds);

    // First, get questions that haven't been answered yet
    const unansweredQuestions = questions.filter(
      (question) => !answeredQuestionsSet.has(question.getId()),
    );

    // If we have enough unanswered questions, return them
    if (unansweredQuestions.length >= limit) {
      return this.shuffleArray(unansweredQuestions).slice(0, limit);
    }

    // Otherwise, fill the remainder with questions that have been answered
    const answeredQuestions = questions.filter((question) =>
      answeredQuestionsSet.has(question.getId()),
    );

    // Combine unanswered and answered questions
    const selectedQuestions = [
      ...unansweredQuestions,
      ...this.shuffleArray(answeredQuestions).slice(
        0,
        limit - unansweredQuestions.length,
      ),
    ];

    return this.shuffleArray(selectedQuestions);
  }

  selectQuestionsWithFrequencies(
    questions: Question[],
    questionFrequencies: Map<string, number>,
    limit: number,
  ): Question[] {
    // First, get unanswered questions (frequency = 0 or not in the map)
    const unansweredQuestions = questions.filter(
      (question) =>
        !questionFrequencies.has(question.getId()) ||
        questionFrequencies.get(question.getId()) === 0,
    );

    // If we have enough unanswered questions, return a random selection
    if (unansweredQuestions.length >= limit) {
      return this.shuffleArray(unansweredQuestions).slice(0, limit);
    }

    // For the remaining slots, prioritize questions with lower frequencies
    const answeredQuestions = questions.filter(
      (question) =>
        questionFrequencies.has(question.getId()) &&
        questionFrequencies.get(question.getId())! > 0,
    );

    // Sort by frequency (ascending)
    const sortedAnsweredQuestions = [...answeredQuestions].sort((a, b) => {
      const freqA = questionFrequencies.get(a.getId())!;
      const freqB = questionFrequencies.get(b.getId())!;
      return freqA - freqB;
    });

    // Combine unanswered questions with the least frequently answered ones
    const selectedQuestions = [
      ...unansweredQuestions,
      ...sortedAnsweredQuestions.slice(0, limit - unansweredQuestions.length),
    ];

    // Return the questions in a random order
    return this.shuffleArray(selectedQuestions);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
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
