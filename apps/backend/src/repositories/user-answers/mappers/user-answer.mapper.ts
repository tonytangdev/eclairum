import { UserAnswer } from '@eclairum/core/entities';
import { Answer } from '@eclairum/core/entities';
import { UserAnswerEntity } from '../../../common/entities/user-answer.entity';

export class UserAnswerMapper {
  static toDomain(entity: UserAnswerEntity): UserAnswer {
    const answer = this.createAnswerFromEntity(entity);
    return this.createUserAnswerFromEntity(entity, answer);
  }

  static toPersistence(domain: UserAnswer): UserAnswerEntity {
    const entity = new UserAnswerEntity();
    entity.id = domain.getId();
    entity.userId = domain.getUserId();
    entity.questionId = domain.getQuestionId();
    entity.answerId = domain.getAnswerId();
    entity.createdAt = domain.getCreatedAt();
    entity.updatedAt = domain.getUpdatedAt();
    return entity;
  }

  private static createAnswerFromEntity(entity: UserAnswerEntity): Answer {
    return new Answer({
      id: entity.answer.id,
      questionId: entity.questionId,
      content: entity.answer.content,
      isCorrect: entity.answer.isCorrect,
    });
  }

  private static createUserAnswerFromEntity(
    entity: UserAnswerEntity,
    answer: Answer,
  ): UserAnswer {
    return new UserAnswer({
      id: entity.id,
      userId: entity.userId,
      questionId: entity.questionId,
      answer,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
