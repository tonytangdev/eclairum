import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FileRepository } from '@eclairum/core/interfaces';
import { File } from '@eclairum/core/entities';
import { FileEntity } from '../../common/entities/file.entity';
import { FileMapper } from './mappers/file.mapper';
import { UnitOfWorkService } from '../../unit-of-work/unit-of-work.service';

@Injectable()
export class FileRepositoryImpl implements FileRepository {
  constructor(private readonly uowService: UnitOfWorkService) {}

  async findById(id: string): Promise<File | null> {
    const fileEntity = await this.findEntityById(id);
    return this.mapEntityToDomainIfExists(fileEntity);
  }

  async findByQuizGenerationTaskId(
    quizGenerationTaskId: string,
  ): Promise<File | null> {
    const fileEntity =
      await this.findEntityByQuizGenerationTaskId(quizGenerationTaskId);
    return this.mapEntityToDomainIfExists(fileEntity);
  }

  async save(file: File): Promise<File> {
    const fileEntity = this.mapDomainToPersistence(file);
    const savedEntity = await this.saveFileEntity(fileEntity);
    return this.mapEntityToDomain(savedEntity);
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date();
    const repo = this.getRepository();
    await repo.update({ id }, { deletedAt: now });
  }

  private async findEntityById(id: string): Promise<FileEntity | null> {
    const repo = this.getRepository();
    return await repo.findOne({
      where: { id },
    });
  }

  private async findEntityByQuizGenerationTaskId(
    quizGenerationTaskId: string,
  ): Promise<FileEntity | null> {
    const repo = this.getRepository();
    return await repo.findOne({
      where: { quizGenerationTaskId },
    });
  }

  private mapEntityToDomainIfExists(entity: FileEntity | null): File | null {
    if (!entity) {
      return null;
    }
    return this.mapEntityToDomain(entity);
  }

  private mapEntityToDomain(entity: FileEntity): File {
    return FileMapper.toDomain(entity);
  }

  private mapDomainToPersistence(file: File): FileEntity {
    return FileMapper.toPersistence(file);
  }

  private async saveFileEntity(entity: FileEntity): Promise<FileEntity> {
    const repo = this.getRepository();
    return await repo.save(entity);
  }

  private getRepository(): Repository<FileEntity> {
    return this.uowService.getManager().getRepository(FileEntity);
  }
}
