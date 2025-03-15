import { Question } from '@flash-me/core/entities';
import { QuestionMapper } from './question.mapper';
import { QuestionEntity } from '../entities/question.entity';
import { faker } from '@faker-js/faker';

describe('QuestionMapper', () => {
  const mockDate = faker.date.past();
  const mockId = faker.string.uuid();
  const mockContent = faker.lorem.paragraph();

  describe('toPersistence', () => {
    it('should convert a domain Question to a QuestionEntity', () => {
      // Arrange
      const domainQuestion = new Question({
        id: mockId,
        content: mockContent,
        answers: [],
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
        quizGenerationTaskId: faker.string.uuid(),
      });

      // Act
      const persistenceQuestion = QuestionMapper.toPersistence(domainQuestion);

      // Assert
      expect(persistenceQuestion).toBeInstanceOf(QuestionEntity);
      expect(persistenceQuestion.id).toBe(mockId);
      expect(persistenceQuestion.content).toBe(mockContent);
      expect(persistenceQuestion.createdAt).toBe(mockDate);
      expect(persistenceQuestion.updatedAt).toBe(mockDate);
      expect(persistenceQuestion.deletedAt).toBeNull();
    });

    it('should handle a Question with deletedAt date', () => {
      // Arrange
      const deletedDate = faker.date.recent();
      const domainQuestion = new Question({
        id: mockId,
        content: mockContent,
        answers: [],
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: deletedDate,
        quizGenerationTaskId: faker.string.uuid(),
      });

      // Act
      const persistenceQuestion = QuestionMapper.toPersistence(domainQuestion);

      // Assert
      expect(persistenceQuestion.deletedAt).toBe(deletedDate);
    });
  });

  describe('toDomain', () => {
    it('should convert a QuestionEntity to a domain Question', () => {
      // Arrange
      const questionEntity = new QuestionEntity();
      questionEntity.id = mockId;
      questionEntity.content = mockContent;
      questionEntity.createdAt = mockDate;
      questionEntity.updatedAt = mockDate;
      questionEntity.deletedAt = null;

      // Act
      const domainQuestion = QuestionMapper.toDomain(questionEntity);

      // Assert
      expect(domainQuestion).toBeInstanceOf(Question);
      expect(domainQuestion.getId()).toBe(mockId);
      expect(domainQuestion.getContent()).toBe(mockContent);
      expect(domainQuestion.getCreatedAt()).toBe(mockDate);
      expect(domainQuestion.getUpdatedAt()).toBe(mockDate);
      expect(domainQuestion.getDeletedAt()).toBeNull();
      expect(domainQuestion.getAnswers()).toEqual([]);
    });

    it('should handle a QuestionEntity with deletedAt date', () => {
      // Arrange
      const deletedDate = faker.date.recent();
      const questionEntity = new QuestionEntity();
      questionEntity.id = faker.string.uuid();
      questionEntity.content = faker.lorem.paragraph();
      questionEntity.createdAt = faker.date.past();
      questionEntity.updatedAt = faker.date.past();
      questionEntity.deletedAt = deletedDate;

      // Act
      const domainQuestion = QuestionMapper.toDomain(questionEntity);

      // Assert
      expect(domainQuestion.getDeletedAt()).toBe(deletedDate);
    });

    it('should initialize answers as an empty array', () => {
      // Arrange
      const questionEntity = new QuestionEntity();
      questionEntity.id = faker.string.uuid();
      questionEntity.content = faker.lorem.paragraph();
      questionEntity.createdAt = faker.date.past();
      questionEntity.updatedAt = faker.date.past();

      // Act
      const domainQuestion = QuestionMapper.toDomain(questionEntity);

      // Assert
      expect(domainQuestion.getAnswers()).toEqual([]);
      expect(domainQuestion.getAnswers()).toHaveLength(0);
    });
  });
});
