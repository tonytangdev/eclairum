import { File } from '@eclairum/core/entities';
import { FileEntity } from '../../../common/entities/file.entity';

export class FileMapper {
  /**
   * Maps a domain File model to a database FileEntity
   */
  public static toPersistence(file: File): FileEntity {
    const entity = new FileEntity();
    entity.id = file.getId();
    entity.path = file.getPath();
    entity.bucketName = file.getBucketName();
    entity.quizGenerationTaskId = file.getQuizGenerationTaskId();
    entity.createdAt = file.getCreatedAt();
    entity.updatedAt = file.getUpdatedAt();
    entity.deletedAt = file.getDeletedAt();

    return entity;
  }

  /**
   * Maps a database FileEntity to a domain File model
   */
  public static toDomain(entity: FileEntity): File {
    return new File({
      id: entity.id,
      path: entity.path,
      bucketName: entity.bucketName,
      quizGenerationTaskId: entity.quizGenerationTaskId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }
}
