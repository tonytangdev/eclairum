import { Answer } from '@flash-me/core/entities';
import { AnswerEntity } from '../entities/answer.entity';

export class AnswerMapper {
  /**
   * Maps a domain Answer model to a database AnswerEntity
   */
  public static toPersistence(answer: Answer): AnswerEntity {
    const entity = new AnswerEntity();
    entity.id = answer.getId();
    entity.content = answer.getContent();
    entity.isCorrect = answer.getIsCorrect();
    entity.questionId = answer.getQuestionId();
    entity.createdAt = answer.getCreatedAt();
    entity.updatedAt = answer.getUpdatedAt();
    entity.deletedAt = answer.getDeletedAt();

    return entity;
  }

  /**
   * Maps a database AnswerEntity to a domain Answer model
   */
  public static toDomain(entity: AnswerEntity): Answer {
    return new Answer({
      id: entity.id,
      content: entity.content,
      isCorrect: entity.isCorrect,
      questionId: entity.questionId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }
}
