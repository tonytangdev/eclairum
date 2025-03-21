import { Answer, Question } from '@eclairum/core/entities';
import { QuestionMapper } from './question.mapper';
import { AnswerMapper } from '../../../../answers/infrastructure/relational/mappers/answer.mapper';
import { faker } from '@faker-js/faker';
import { QuestionEntity } from '../../../../common/entities/question.entity';
import { AnswerEntity } from '../../../../common/entities/answer.entity';

jest.mock(
  '../../../../answers/infrastructure/relational/mappers/answer.mapper',
);

describe('QuestionMapper', () => {
  const mockDate = faker.date.past();
  const mockId = faker.string.uuid();
  const mockContent = faker.lorem.paragraph();
  const mockQuizGenerationTaskId = faker.string.uuid();

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
        quizGenerationTaskId: mockQuizGenerationTaskId,
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
      expect(persistenceQuestion.quizGenerationTaskId).toBe(
        mockQuizGenerationTaskId,
      );
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
      questionEntity.quizGenerationTaskId = mockQuizGenerationTaskId;

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
      expect(domainQuestion.getQuizGenerationTaskId()).toBe(
        mockQuizGenerationTaskId,
      );
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
      questionEntity.quizGenerationTaskId = mockQuizGenerationTaskId;

      // Act
      const domainQuestion = QuestionMapper.toDomain(questionEntity);

      // Assert
      expect(domainQuestion.getDeletedAt()).toBe(deletedDate);
      expect(domainQuestion.getQuizGenerationTaskId()).toBe(
        mockQuizGenerationTaskId,
      );
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

    it('should map associated answer entities to domain answer objects', () => {
      // Arrange
      const mockAnswerEntity1 = new AnswerEntity();
      const mockAnswerEntity2 = new AnswerEntity();

      const mockAnswerDomain1 = new Answer({
        id: faker.string.uuid(),
        content: faker.lorem.sentence(),
        isCorrect: true,
        questionId: mockId,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      const mockAnswerDomain2 = new Answer({
        id: faker.string.uuid(),
        content: faker.lorem.sentence(),
        isCorrect: false,
        questionId: mockId,
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      // Mock the AnswerMapper.toDomain method
      (AnswerMapper.toDomain as jest.Mock)
        .mockReturnValueOnce(mockAnswerDomain1)
        .mockReturnValueOnce(mockAnswerDomain2);

      const questionEntity = new QuestionEntity();
      questionEntity.id = mockId;
      questionEntity.content = mockContent;
      questionEntity.createdAt = mockDate;
      questionEntity.updatedAt = mockDate;
      questionEntity.deletedAt = null;
      questionEntity.answers = [mockAnswerEntity1, mockAnswerEntity2];
      questionEntity.quizGenerationTaskId = mockQuizGenerationTaskId;

      // Act
      const domainQuestion = QuestionMapper.toDomain(questionEntity);

      // Assert
      expect(AnswerMapper.toDomain).toHaveBeenCalledTimes(2);
      expect(AnswerMapper.toDomain).toHaveBeenCalledWith(mockAnswerEntity1);
      expect(AnswerMapper.toDomain).toHaveBeenCalledWith(mockAnswerEntity2);
      expect(domainQuestion.getAnswers()).toHaveLength(2);
      expect(domainQuestion.getAnswers()).toContain(mockAnswerDomain1);
      expect(domainQuestion.getAnswers()).toContain(mockAnswerDomain2);
      expect(domainQuestion.getQuizGenerationTaskId()).toBe(
        mockQuizGenerationTaskId,
      );
    });
  });
});
