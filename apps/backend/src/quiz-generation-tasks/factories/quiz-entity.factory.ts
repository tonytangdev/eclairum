import { Injectable } from '@nestjs/common';
import {
  Question,
  Answer,
  QuizGenerationTask,
  QuizGenerationStatus,
} from '@flash-me/core/entities';
import {
  QuestionAnswerPair,
  AnswerData,
} from '../services/question-generation.service';

@Injectable()
export class QuizEntityFactory {
  createTask(text: string, userId: string): QuizGenerationTask {
    return new QuizGenerationTask({
      textContent: text,
      questions: [],
      status: QuizGenerationStatus.IN_PROGRESS,
      userId,
    });
  }

  createQuestionEntities(
    questionAnswerPairs: QuestionAnswerPair[],
  ): Question[] {
    return questionAnswerPairs.map((pair) => {
      const question = new Question({
        content: pair.question,
        answers: [],
      });

      const answers = this.createAnswersForQuestion(
        question.getId(),
        pair.answers,
      );
      answers.forEach((answer) => question.addAnswer(answer));
      return question;
    });
  }

  createAnswersForQuestion(
    questionId: string,
    answerData: AnswerData[],
  ): Answer[] {
    return answerData.map(
      (answer) =>
        new Answer({
          content: answer.content,
          isCorrect: answer.isCorrect,
          questionId,
        }),
    );
  }

  extractAllAnswers(questions: Question[]): Answer[] {
    return questions.flatMap((question) => question.getAnswers());
  }

  addQuestionsToTask(task: QuizGenerationTask, questions: Question[]): void {
    questions.forEach((question) => task.addQuestion(question));
  }
}
