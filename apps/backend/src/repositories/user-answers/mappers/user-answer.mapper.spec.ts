import { UserAnswerMapper } from './user-answer.mapper';
import { UserAnswer } from '@eclairum/core/entities';
import { Answer } from '@eclairum/core/entities';
import { faker } from '@faker-js/faker';
import { AnswerEntity } from '../../../common/entities/answer.entity';
import { UserAnswerEntity } from '../../../common/entities/user-answer.entity';

describe('UserAnswerMapper', () => {
  // Common test data
  const testId = faker.string.uuid();
  const testUserId = faker.string.alphanumeric(10);
  const testQuestionId = faker.string.uuid();
  const testAnswerId = faker.string.uuid();
  const testAnswerContent = faker.lorem.sentence();
  const testCreatedAt = new Date('2023-01-01T00:00:00Z');
  const testUpdatedAt = new Date('2023-01-02T00:00:00Z');
  const isCorrect = true;

  describe('toDomain', () => {
    it('should convert entity to domain object with related answer entity', () => {
      // Arrange
      const answerEntity = new AnswerEntity();
      answerEntity.id = testAnswerId;
      answerEntity.content = testAnswerContent;
      answerEntity.isCorrect = isCorrect;

      const entity = new UserAnswerEntity();
      entity.id = testId;
      entity.userId = testUserId;
      entity.questionId = testQuestionId;
      entity.answerId = testAnswerId;
      entity.answer = answerEntity;
      entity.createdAt = testCreatedAt;
      entity.updatedAt = testUpdatedAt;

      // Act
      const domain = UserAnswerMapper.toDomain(entity);

      // Assert
      expect(domain).toBeInstanceOf(UserAnswer);
      expect(domain.getId()).toBe(testId);
      expect(domain.getUserId()).toBe(testUserId);
      expect(domain.getQuestionId()).toBe(testQuestionId);
      expect(domain.getAnswerId()).toBe(testAnswerId);
      expect(domain.isCorrect()).toBe(isCorrect);
      expect(domain.getCreatedAt()).toEqual(testCreatedAt);
      expect(domain.getUpdatedAt()).toEqual(testUpdatedAt);

      // Verify answer data was mapped correctly
      const answer = domain.getAnswer();
      expect(answer).toBeInstanceOf(Answer);
      expect(answer.getId()).toBe(testAnswerId);
      expect(answer.getQuestionId()).toBe(testQuestionId);
      expect(answer.getContent()).toBe(testAnswerContent);
      expect(answer.getIsCorrect()).toBe(isCorrect);
    });
  });

  describe('toPersistence', () => {
    it('should convert domain object to entity', () => {
      // Arrange
      const answer = new Answer({
        id: testAnswerId,
        questionId: testQuestionId,
        content: testAnswerContent,
        isCorrect,
      });

      const domain = new UserAnswer({
        id: testId,
        userId: testUserId,
        questionId: testQuestionId,
        answer,
        createdAt: testCreatedAt,
        updatedAt: testUpdatedAt,
      });

      // Act
      const entity = UserAnswerMapper.toPersistence(domain);

      // Assert
      expect(entity).toBeInstanceOf(UserAnswerEntity);
      expect(entity.id).toBe(testId);
      expect(entity.userId).toBe(testUserId);
      expect(entity.questionId).toBe(testQuestionId);
      expect(entity.answerId).toBe(testAnswerId);
      expect(entity.createdAt).toEqual(testCreatedAt);
      expect(entity.updatedAt).toEqual(testUpdatedAt);

      // Note: The related entities (answer, question, user) are not set
      // in the entity as they are handled by TypeORM relations
      expect(entity.answer).toBeUndefined();
    });
  });
});
