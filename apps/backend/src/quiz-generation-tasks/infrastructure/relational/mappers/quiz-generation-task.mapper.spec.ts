import { QuizGenerationTaskMapper } from './quiz-generation-task.mapper';
import {
  QuizGenerationTask,
  Question,
  QuizGenerationStatus,
} from '@eclairum/core/entities';
import { QuizGenerationTaskEntity } from '../entities/quiz-generation-task.entity';
import { QuestionEntity } from '../../../../questions/infrastructure/relational/entities/question.entity';
import { faker } from '@faker-js/faker';

describe('QuizGenerationTaskMapper', () => {
  describe('toEntity', () => {
    it('should correctly map a domain model to an entity', () => {
      // Arrange
      const questions = [
        new Question({
          id: faker.string.uuid(),
          content: faker.lorem.sentence(),
          answers: [],
          quizGenerationTaskId: faker.string.uuid(),
        }),
        new Question({
          id: faker.string.uuid(),
          content: faker.lorem.sentence(),
          answers: [],
          quizGenerationTaskId: faker.string.uuid(),
        }),
      ];

      const userId = faker.string.uuid();
      const domainModel = new QuizGenerationTask({
        id: faker.string.uuid(),
        textContent: faker.lorem.paragraphs(2),
        status: QuizGenerationStatus.COMPLETED,
        questions,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        generatedAt: new Date(),
        userId,
      });

      // Act
      const entity = QuizGenerationTaskMapper.toEntity(domainModel);

      // Assert
      expect(entity).toBeInstanceOf(QuizGenerationTaskEntity);
      expect(entity.id).toBe(domainModel.getId());
      expect(entity.textContent).toBe(domainModel.getTextContent());
      expect(entity.status).toBe(domainModel.getStatus());
      expect(entity.createdAt).toBe(domainModel.getCreatedAt());
      expect(entity.updatedAt).toBe(domainModel.getUpdatedAt());
      expect(entity.deletedAt).toBe(domainModel.getDeletedAt());
      expect(entity.generatedAt).toBe(domainModel.getGeneratedAt());
      expect(entity.userId).toBe(userId);

      // Check questions mapping
      expect(entity.questions).toHaveLength(questions.length);
      entity.questions.forEach((questionEntity, index) => {
        expect(questionEntity).toBeInstanceOf(QuestionEntity);
        expect(questionEntity.id).toBe(questions[index].getId());
      });
    });

    it('should handle domain model without questions', () => {
      // Arrange
      const userId = faker.string.uuid();
      const domainModel = new QuizGenerationTask({
        id: faker.string.uuid(),
        textContent: faker.lorem.paragraphs(2),
        status: QuizGenerationStatus.PENDING,
        questions: [],
        userId,
      });

      // Act
      const entity = QuizGenerationTaskMapper.toEntity(domainModel);

      // Assert
      expect(entity.questions).toEqual([]);
      expect(entity.userId).toBe(userId);
    });
  });

  describe('toDomain', () => {
    it('should correctly map an entity to a domain model', () => {
      // Arrange
      const entity = new QuizGenerationTaskEntity();
      entity.id = faker.string.uuid();
      entity.textContent = faker.lorem.paragraphs(2);
      entity.status = QuizGenerationStatus.COMPLETED;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();
      entity.deletedAt = null;
      entity.generatedAt = new Date();
      entity.userId = faker.string.uuid();

      // Create question entities
      entity.questions = [
        Object.assign(new QuestionEntity(), {
          id: faker.string.uuid(),
          content: faker.lorem.sentence(),
        }),
        Object.assign(new QuestionEntity(), {
          id: faker.string.uuid(),
          content: faker.lorem.sentence(),
        }),
      ];

      // Act
      const domainModel = QuizGenerationTaskMapper.toDomain(entity);

      // Assert
      expect(domainModel).toBeInstanceOf(QuizGenerationTask);
      expect(domainModel.getId()).toBe(entity.id);
      expect(domainModel.getTextContent()).toBe(entity.textContent);
      expect(domainModel.getStatus()).toBe(entity.status);
      expect(domainModel.getCreatedAt()).toBe(entity.createdAt);
      expect(domainModel.getUpdatedAt()).toBe(entity.updatedAt);
      expect(domainModel.getDeletedAt()).toBe(entity.deletedAt);
      expect(domainModel.getGeneratedAt()).toBe(entity.generatedAt);
      expect(domainModel.getUserId()).toBe(entity.userId);

      // Check questions mapping
      const questions = domainModel.getQuestions();
      expect(questions).toHaveLength(entity.questions.length);
      questions.forEach((question, index) => {
        expect(question).toBeInstanceOf(Question);
        expect(question.getId()).toBe(entity.questions[index].id);
        expect(question.getContent()).toBe(entity.questions[index].content);
        // Verify answers array is empty as specified in the mapper
        expect(question.getAnswers()).toEqual([]);
      });
    });

    it('should handle entity without questions', () => {
      // Arrange
      const entity = new QuizGenerationTaskEntity();
      entity.id = faker.string.uuid();
      entity.textContent = faker.lorem.paragraphs(2);
      entity.status = QuizGenerationStatus.PENDING;
      entity.questions = [];
      entity.userId = faker.string.uuid();

      // Act
      const domainModel = QuizGenerationTaskMapper.toDomain(entity);

      // Assert
      expect(domainModel.getQuestions()).toEqual([]);
      expect(domainModel.getUserId()).toBe(entity.userId);
    });
  });

  describe('toDomainList', () => {
    it('should map a list of entities to domain models', () => {
      // Arrange
      const createEntity = () => {
        const entity = new QuizGenerationTaskEntity();
        entity.id = faker.string.uuid();
        entity.textContent = faker.lorem.paragraphs(1);
        entity.status = QuizGenerationStatus.COMPLETED;
        entity.userId = faker.string.uuid();
        entity.questions = [
          Object.assign(new QuestionEntity(), {
            id: faker.string.uuid(),
            content: faker.lorem.sentence(),
          }),
        ];
        return entity;
      };

      const entities = [createEntity(), createEntity(), createEntity()];

      // Spy on toDomain to verify it's called for each entity
      const toDomainSpy = jest.spyOn(QuizGenerationTaskMapper, 'toDomain');

      // Act
      const domainModels = QuizGenerationTaskMapper.toDomainList(entities);

      // Assert
      expect(domainModels).toHaveLength(entities.length);
      expect(toDomainSpy).toHaveBeenCalledTimes(entities.length);

      // Verify each domain model
      domainModels.forEach((domainModel, index) => {
        expect(domainModel).toBeInstanceOf(QuizGenerationTask);
        expect(domainModel.getId()).toBe(entities[index].id);
        expect(domainModel.getTextContent()).toBe(entities[index].textContent);
        expect(domainModel.getUserId()).toBe(entities[index].userId);
      });

      // Clean up spy
      toDomainSpy.mockRestore();
    });

    it('should return an empty array when given an empty array', () => {
      // Act
      const result = QuizGenerationTaskMapper.toDomainList([]);

      // Assert
      expect(result).toEqual([]);
    });
  });

  // Test edge cases
  describe('edge cases', () => {
    it('should handle null dates', () => {
      // Arrange
      const entity = new QuizGenerationTaskEntity();
      entity.id = faker.string.uuid();
      entity.textContent = faker.lorem.paragraphs(1);
      entity.status = QuizGenerationStatus.PENDING;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();
      entity.deletedAt = null;
      entity.generatedAt = null; // Explicitly null
      entity.questions = [];
      entity.userId = faker.string.uuid();

      // Act
      const domainModel = QuizGenerationTaskMapper.toDomain(entity);

      // Assert
      expect(domainModel.getGeneratedAt()).toBeNull();
    });

    it('should handle different status values', () => {
      // Test all possible status values
      const statuses = [
        QuizGenerationStatus.PENDING,
        QuizGenerationStatus.IN_PROGRESS,
        QuizGenerationStatus.COMPLETED,
        QuizGenerationStatus.FAILED,
      ];

      statuses.forEach((status) => {
        // Arrange
        const userId = faker.string.uuid();
        const domainModel = new QuizGenerationTask({
          id: faker.string.uuid(),
          textContent: faker.lorem.sentence(),
          status,
          questions: [],
          userId,
        });

        // Act
        const entity = QuizGenerationTaskMapper.toEntity(domainModel);
        const mappedBack = QuizGenerationTaskMapper.toDomain(entity);

        // Assert
        expect(entity.status).toBe(status);
        expect(mappedBack.getStatus()).toBe(status);
        expect(entity.userId).toBe(userId);
        expect(mappedBack.getUserId()).toBe(userId);
      });
    });
  });
});
