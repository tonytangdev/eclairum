import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { UserAnswerRepositoryImpl } from './user-answer.repository';
import { UserAnswerEntity } from '../entities/user-answer.entity';
import { UserAnswerMapper } from '../mappers/user-answer.mapper';
import { UserAnswer } from '@flash-me/core/entities';
import { UserEntity } from '../../../../users/infrastructure/relational/entities/user.entity';
import { QuestionEntity } from '../../../../questions/infrastructure/relational/entities/question.entity';
import { AnswerEntity } from '../../../../answers/infrastructure/relational/entities/answer.entity';
import { Answer } from '@flash-me/core/entities';

describe('UserAnswerRepositoryImpl', () => {
  let userAnswerRepositoryImpl: UserAnswerRepositoryImpl;
  let userAnswerRepository: jest.Mocked<Repository<UserAnswerEntity>>;

  const createMockUserAnswerEntity = (): UserAnswerEntity => {
    const questionId = faker.string.uuid();

    // Create answer entity based on the actual AnswerEntity structure
    const answer = new AnswerEntity();
    answer.id = faker.string.uuid();
    answer.content = faker.lorem.sentence();
    answer.isCorrect = faker.datatype.boolean();
    answer.questionId = questionId;
    answer.createdAt = faker.date.recent();
    answer.updatedAt = faker.date.recent();
    answer.deletedAt = null;

    // Create question entity
    const question = new QuestionEntity();
    question.id = questionId;
    question.content = faker.lorem.sentence();
    answer.question = question;

    // Create user entity
    const user = new UserEntity();
    user.id = faker.string.uuid();
    user.email = faker.internet.email();

    // Create user answer entity with proper relationships
    const entity = new UserAnswerEntity();
    entity.id = faker.string.uuid();
    entity.userId = user.id;
    entity.user = user;
    entity.questionId = questionId;
    entity.question = question;
    entity.answerId = answer.id;
    entity.answer = answer;
    entity.createdAt = faker.date.recent();
    entity.updatedAt = faker.date.recent();

    return entity;
  };

  const createMockUserAnswer = (): UserAnswer => {
    const answer = new Answer({
      id: faker.string.uuid(),
      content: faker.lorem.sentence(),
      isCorrect: faker.datatype.boolean(),
      questionId: faker.string.uuid(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      deletedAt: null,
    });

    return new UserAnswer({
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      questionId: faker.string.uuid(),
      answer,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    });
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserAnswerRepositoryImpl,
        {
          provide: getRepositoryToken(UserAnswerEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    userAnswerRepositoryImpl = module.get<UserAnswerRepositoryImpl>(
      UserAnswerRepositoryImpl,
    );
    userAnswerRepository = module.get(getRepositoryToken(UserAnswerEntity));
  });

  describe('findById', () => {
    it('should return a UserAnswer when entity is found', async () => {
      // Arrange
      const mockEntity = createMockUserAnswerEntity();
      const mockDomain = UserAnswerMapper.toDomain(mockEntity);

      userAnswerRepository.findOne.mockResolvedValue(mockEntity);
      jest.spyOn(UserAnswerMapper, 'toDomain').mockReturnValue(mockDomain);

      // Act
      const result = await userAnswerRepositoryImpl.findById(mockEntity.id);

      // Assert
      expect(userAnswerRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockEntity.id },
        relations: ['answer'],
      });
      expect(result).toEqual(mockDomain);
    });

    it('should return null when entity is not found', async () => {
      // Arrange
      const id = faker.string.uuid();
      userAnswerRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await userAnswerRepositoryImpl.findById(id);

      // Assert
      expect(userAnswerRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['answer'],
      });
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save user answer and return it', async () => {
      // Arrange
      const mockUserAnswer = createMockUserAnswer();
      const mockEntity = UserAnswerMapper.toPersistence(mockUserAnswer);

      jest.spyOn(UserAnswerMapper, 'toPersistence').mockReturnValue(mockEntity);
      userAnswerRepository.save.mockResolvedValue(mockEntity);

      // Act
      const result = await userAnswerRepositoryImpl.save(mockUserAnswer);

      // Assert
      expect(UserAnswerMapper.toPersistence).toHaveBeenCalledWith(
        mockUserAnswer,
      );
      expect(userAnswerRepository.save).toHaveBeenCalledWith(mockEntity);
      expect(result).toEqual(mockUserAnswer);
    });
  });
});
