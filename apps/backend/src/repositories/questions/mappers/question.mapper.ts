import { Answer, Question } from '@eclairum/core/entities';
import { QuestionEntity } from '../../../common/entities/question.entity';
import { AnswerMapper } from '../../answers/mappers/answer.mapper';

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
    entity.quizGenerationTaskId = question.getQuizGenerationTaskId();

    return entity;
  }

  /**
   * Maps a database QuestionEntity to a domain Question model
   * Note: This would need Answer instances to fully construct a Question
   */
  public static toDomain(entity: QuestionEntity): Question {
    let answers: Answer[] = [];
    if (entity.answers) {
      answers = entity.answers.map((answer) => AnswerMapper.toDomain(answer));
    }

    return new Question({
      id: entity.id,
      content: entity.content,
      answers: answers,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
      quizGenerationTaskId: entity.quizGenerationTaskId,
    });
  }
}
