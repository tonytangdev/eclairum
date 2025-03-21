import { Answer } from '@eclairum/core/entities';
import { AnswerMapper } from './answer.mapper';
import { faker } from '@faker-js/faker';
import { AnswerEntity } from '../../../common/entities/answer.entity';

describe('AnswerMapper', () => {
  const mockDate = faker.date.past();
  const mockId = faker.string.uuid();
  const mockContent = faker.lorem.paragraph();
  const mockQuestionId = faker.string.uuid();
  const mockIsCorrect = faker.datatype.boolean();

  describe('toPersistence', () => {
    it('should convert a domain Answer to an AnswerEntity', () => {
      // Arrange
      const domainAnswer = new Answer({
        id: mockId,
        content: mockContent,
        questionId: mockQuestionId,
        isCorrect: mockIsCorrect,
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      });

      // Act
      const persistenceAnswer = AnswerMapper.toPersistence(domainAnswer);

      // Assert
      expect(persistenceAnswer).toBeInstanceOf(AnswerEntity);
      expect(persistenceAnswer.id).toBe(mockId);
      expect(persistenceAnswer.content).toBe(mockContent);
      expect(persistenceAnswer.questionId).toBe(mockQuestionId);
      expect(persistenceAnswer.isCorrect).toBe(mockIsCorrect);
      expect(persistenceAnswer.createdAt).toBe(mockDate);
      expect(persistenceAnswer.updatedAt).toBe(mockDate);
      expect(persistenceAnswer.deletedAt).toBeNull();
    });

    it('should handle an Answer with deletedAt date', () => {
      // Arrange
      const deletedDate = faker.date.recent();
      const domainAnswer = new Answer({
        id: mockId,
        content: mockContent,
        questionId: mockQuestionId,
        isCorrect: mockIsCorrect,
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: deletedDate,
      });

      // Act
      const persistenceAnswer = AnswerMapper.toPersistence(domainAnswer);

      // Assert
      expect(persistenceAnswer.deletedAt).toBe(deletedDate);
    });

    it('should correctly map isCorrect boolean value', () => {
      // Arrange - True case
      const domainAnswerTrue = new Answer({
        id: mockId,
        content: mockContent,
        questionId: mockQuestionId,
        isCorrect: true,
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      });

      // Arrange - False case
      const domainAnswerFalse = new Answer({
        id: faker.string.uuid(),
        content: faker.lorem.paragraph(),
        questionId: mockQuestionId,
        isCorrect: false,
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: null,
      });

      // Act
      const persistenceAnswerTrue =
        AnswerMapper.toPersistence(domainAnswerTrue);
      const persistenceAnswerFalse =
        AnswerMapper.toPersistence(domainAnswerFalse);

      // Assert
      expect(persistenceAnswerTrue.isCorrect).toBe(true);
      expect(persistenceAnswerFalse.isCorrect).toBe(false);
    });
  });

  describe('toDomain', () => {
    it('should convert an AnswerEntity to a domain Answer', () => {
      // Arrange
      const answerEntity = new AnswerEntity();
      answerEntity.id = mockId;
      answerEntity.content = mockContent;
      answerEntity.questionId = mockQuestionId;
      answerEntity.isCorrect = mockIsCorrect;
      answerEntity.createdAt = mockDate;
      answerEntity.updatedAt = mockDate;
      answerEntity.deletedAt = null;

      // Act
      const domainAnswer = AnswerMapper.toDomain(answerEntity);

      // Assert
      expect(domainAnswer).toBeInstanceOf(Answer);
      expect(domainAnswer.getId()).toBe(mockId);
      expect(domainAnswer.getContent()).toBe(mockContent);
      expect(domainAnswer.getQuestionId()).toBe(mockQuestionId);
      expect(domainAnswer.getIsCorrect()).toBe(mockIsCorrect);
      expect(domainAnswer.getCreatedAt()).toBe(mockDate);
      expect(domainAnswer.getUpdatedAt()).toBe(mockDate);
      expect(domainAnswer.getDeletedAt()).toBeNull();
    });

    it('should handle an AnswerEntity with deletedAt date', () => {
      // Arrange
      const deletedDate = faker.date.recent();
      const answerEntity = new AnswerEntity();
      answerEntity.id = faker.string.uuid();
      answerEntity.content = faker.lorem.paragraph();
      answerEntity.questionId = faker.string.uuid();
      answerEntity.isCorrect = faker.datatype.boolean();
      answerEntity.createdAt = faker.date.past();
      answerEntity.updatedAt = faker.date.past();
      answerEntity.deletedAt = deletedDate;

      // Act
      const domainAnswer = AnswerMapper.toDomain(answerEntity);

      // Assert
      expect(domainAnswer.getDeletedAt()).toBe(deletedDate);
    });

    it('should correctly map isCorrect boolean value', () => {
      // Arrange - True case
      const trueEntity = new AnswerEntity();
      trueEntity.id = mockId;
      trueEntity.content = mockContent;
      trueEntity.questionId = mockQuestionId;
      trueEntity.isCorrect = true;
      trueEntity.createdAt = mockDate;
      trueEntity.updatedAt = mockDate;

      // Arrange - False case
      const falseEntity = new AnswerEntity();
      falseEntity.id = faker.string.uuid();
      falseEntity.content = faker.lorem.paragraph();
      falseEntity.questionId = mockQuestionId;
      falseEntity.isCorrect = false;
      falseEntity.createdAt = mockDate;
      falseEntity.updatedAt = mockDate;

      // Act
      const domainAnswerTrue = AnswerMapper.toDomain(trueEntity);
      const domainAnswerFalse = AnswerMapper.toDomain(falseEntity);

      // Assert
      expect(domainAnswerTrue.getIsCorrect()).toBe(true);
      expect(domainAnswerFalse.getIsCorrect()).toBe(false);
    });
  });
});
