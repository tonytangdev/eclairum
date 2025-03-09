import { Test } from '@nestjs/testing';
import { QuizEntityFactory } from './quiz-entity.factory';
import {
  QuizGenerationTask,
  Question,
  Answer,
  QuizGenerationStatus,
} from '@flash-me/core/entities';
import {
  QuestionAnswerPair,
  AnswerData,
} from '../services/question-generation.service';
import { faker } from '@faker-js/faker';

describe('QuizEntityFactory', () => {
  let quizEntityFactory: QuizEntityFactory;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [QuizEntityFactory],
    }).compile();

    quizEntityFactory = moduleRef.get<QuizEntityFactory>(QuizEntityFactory);
  });

  describe('createTask', () => {
    it('should create a new QuizGenerationTask with IN_PROGRESS status', () => {
      // Arrange
      const text = faker.lorem.paragraphs(3);

      // Act
      const task = quizEntityFactory.createTask(text);

      // Assert
      expect(task).toBeInstanceOf(QuizGenerationTask);
      expect(task.getTextContent()).toBe(text);
      expect(task.getStatus()).toBe(QuizGenerationStatus.IN_PROGRESS);
      expect(task.getQuestions()).toEqual([]);
    });
  });

  describe('createQuestionEntities', () => {
    it('should create Question entities from question-answer pairs', () => {
      // Arrange
      const questionAnswerPairs: QuestionAnswerPair[] = [
        {
          question: faker.lorem.sentence() + '?',
          answers: [
            { content: faker.lorem.words(2), isCorrect: true },
            { content: faker.lorem.words(2), isCorrect: false },
          ],
        },
        {
          question: faker.lorem.sentence() + '?',
          answers: [
            { content: faker.lorem.words(2), isCorrect: true },
            { content: faker.lorem.words(2), isCorrect: false },
          ],
        },
      ];

      // Act
      const questions =
        quizEntityFactory.createQuestionEntities(questionAnswerPairs);

      // Assert
      expect(questions).toHaveLength(2);
      expect(questions[0].getContent()).toBe(questionAnswerPairs[0].question);
      expect(questions[0].getAnswers()).toHaveLength(2);
      expect(questions[1].getContent()).toBe(questionAnswerPairs[1].question);
      expect(questions[1].getAnswers()).toHaveLength(2);
    });
  });

  describe('createAnswersForQuestion', () => {
    it('should create Answer entities with correct questionId', () => {
      // Arrange
      const questionId = faker.string.uuid();
      const answerData: AnswerData[] = [
        { content: faker.lorem.words(3), isCorrect: true },
        { content: faker.lorem.words(3), isCorrect: false },
      ];

      // Act
      const answers = quizEntityFactory.createAnswersForQuestion(
        questionId,
        answerData,
      );

      // Assert
      expect(answers).toHaveLength(2);
      expect(answers[0].getContent()).toBe(answerData[0].content);
      expect(answers[0].getIsCorrect()).toBe(true);
      expect(answers[0].getQuestionId()).toBe(questionId);
      expect(answers[1].getContent()).toBe(answerData[1].content);
      expect(answers[1].getIsCorrect()).toBe(false);
      expect(answers[1].getQuestionId()).toBe(questionId);
    });
  });

  describe('extractAllAnswers', () => {
    it('should extract all answers from an array of questions', () => {
      // Arrange
      const question1 = new Question({
        content: faker.lorem.sentence(),
        answers: [],
      });
      const question2 = new Question({
        content: faker.lorem.sentence(),
        answers: [],
      });

      const answer1 = new Answer({
        content: faker.lorem.words(3),
        isCorrect: true,
        questionId: question1.getId(),
      });
      const answer2 = new Answer({
        content: faker.lorem.words(3),
        isCorrect: false,
        questionId: question1.getId(),
      });
      const answer3 = new Answer({
        content: faker.lorem.words(3),
        isCorrect: true,
        questionId: question2.getId(),
      });

      question1.addAnswer(answer1);
      question1.addAnswer(answer2);
      question2.addAnswer(answer3);

      const questions = [question1, question2];

      // Act
      const allAnswers = quizEntityFactory.extractAllAnswers(questions);

      // Assert
      expect(allAnswers).toHaveLength(3);
      expect(allAnswers).toContain(answer1);
      expect(allAnswers).toContain(answer2);
      expect(allAnswers).toContain(answer3);
    });
  });

  describe('addQuestionsToTask', () => {
    it('should add questions to a task', () => {
      // Arrange
      const task = new QuizGenerationTask({
        textContent: faker.lorem.paragraphs(2),
        questions: [],
        status: QuizGenerationStatus.IN_PROGRESS,
      });

      const question1 = new Question({
        content: faker.lorem.sentence(),
        answers: [],
      });
      const question2 = new Question({
        content: faker.lorem.sentence(),
        answers: [],
      });
      const questions = [question1, question2];

      // Act
      quizEntityFactory.addQuestionsToTask(task, questions);

      // Assert
      expect(task.getQuestions()).toHaveLength(2);
      expect(task.getQuestions()[0]).toBe(question1);
      expect(task.getQuestions()[1]).toBe(question2);
    });
  });
});
