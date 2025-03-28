import { QuizGenerationTask, Question, Answer } from '@eclairum/core/entities';
import { QuizGenerationTaskEntity } from '../../../common/entities/quiz-generation-task.entity';
import { QuestionMapper } from '../../questions/mappers/question.mapper';

export class QuizGenerationTaskMapper {
  /**
   * Maps a domain QuizGenerationTask to a database entity
   * @param domainModel The domain model to map
   * @returns The database entity
   */
  public static toEntity(
    domainModel: QuizGenerationTask,
  ): QuizGenerationTaskEntity {
    const entity = new QuizGenerationTaskEntity();
    entity.id = domainModel.getId();
    entity.textContent = domainModel.getTextContent();
    entity.status = domainModel.getStatus();
    entity.generatedAt = domainModel.getGeneratedAt();
    entity.createdAt = domainModel.getCreatedAt();
    entity.updatedAt = domainModel.getUpdatedAt();
    entity.deletedAt = domainModel.getDeletedAt();
    entity.userId = domainModel.getUserId();
    entity.title = domainModel.getTitle();

    // Map question relationships
    entity.questions = domainModel.getQuestions().map((question) => {
      const questionEntity = QuestionMapper.toPersistence(question);
      return questionEntity;
    });

    return entity;
  }

  /**
   * Maps a database entity to a domain QuizGenerationTask
   * @param entity The database entity to map
   * @returns The domain model
   */
  public static toDomain(entity: QuizGenerationTaskEntity): QuizGenerationTask {
    return new QuizGenerationTask({
      id: entity.id,
      textContent: entity.textContent,
      status: entity.status,
      questions: (entity.questions ?? []).map(
        (questionEntity) =>
          new Question({
            id: questionEntity.id,
            content: questionEntity.content,
            answers: (questionEntity.answers ?? []).map(
              (answerEntity) =>
                new Answer({
                  id: answerEntity.id,
                  content: answerEntity.content,
                  isCorrect: answerEntity.isCorrect,
                  questionId: questionEntity.id,
                }),
            ),
            quizGenerationTaskId: entity.id,
          }),
      ),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
      generatedAt: entity.generatedAt,
      userId: entity.userId,
      title: entity.title,
    });
  }

  /**
   * Maps a list of database entities to domain QuizGenerationTask objects
   * @param entities The list of database entities
   * @returns List of domain models
   */
  public static toDomainList(
    entities: QuizGenerationTaskEntity[],
  ): QuizGenerationTask[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
