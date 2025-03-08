import { Question } from '@flash-me/core/entities';
import { QuestionEntity } from '../entities/question.entity';

export class QuestionMapper {
  /**
   * Maps a domain Question model to a database QuestionEntity
   */
  public static toPersistence(question: Question): QuestionEntity {
    const entity = new QuestionEntity();
    entity.id = question.getId();
    entity.content = question.getContent();
    entity.createdAt = question.getCreatedAt();
    entity.updatedAt = question.getUpdatedAt();
    entity.deletedAt = question.getDeletedAt();

    return entity;
  }

  /**
   * Maps a database QuestionEntity to a domain Question model
   * Note: This would need Answer instances to fully construct a Question
   */
  public static toDomain(entity: QuestionEntity): Question {
    return new Question({
      id: entity.id,
      content: entity.content,
      answers: [], // Would need to be populated from a separate query
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }
}
