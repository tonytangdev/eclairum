import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { QuizGenerationTask } from '@flash-me/core/entities';
import { QuizGenerationTaskRepository } from '@flash-me/core/interfaces';
import { QuizGenerationTaskEntity } from '../entities/quiz-generation-task.entity';
import { QuizGenerationTaskMapper } from '../mappers/quiz-generation-task.mapper';

@Injectable()
export class QuizGenerationTaskRepositoryImpl
  implements QuizGenerationTaskRepository
{
  private currentEntityManager?: EntityManager;

  constructor(
    @InjectRepository(QuizGenerationTaskEntity)
    private readonly quizGenerationTaskRepository: Repository<QuizGenerationTaskEntity>,
  ) {}

  setEntityManager(entityManager: EntityManager): void {
    this.currentEntityManager = entityManager;
  }

  /**
   * Implements the interface method to save a quiz generation task
   * @param task The task to save
   * @returns Promise that resolves when the task is saved
   */
  async saveTask(task: QuizGenerationTask): Promise<void> {
    await this.save(task);
  }

  /**
   * Extended method to save a quiz generation task with additional options
   * @param quizGenerationTask The task to save
   * @param entityManager Optional entity manager for transactions
   * @returns The saved task
   */
  async save(
    quizGenerationTask: QuizGenerationTask,
    entityManager?: EntityManager,
  ): Promise<QuizGenerationTask> {
    const repo = this.getRepository(entityManager);

    const quizGenerationTaskEntity =
      QuizGenerationTaskMapper.toEntity(quizGenerationTask);
    await repo.save(quizGenerationTaskEntity);

    return quizGenerationTask;
  }

  async findById(id: string): Promise<QuizGenerationTask | null> {
    const repo = this.getRepository();
    const quizGenerationTaskEntity = await repo.findOne({
      where: { id },
      relations: ['questions'],
    });

    if (!quizGenerationTaskEntity) {
      return null;
    }

    return QuizGenerationTaskMapper.toDomain(quizGenerationTaskEntity);
  }

  async findAll(): Promise<QuizGenerationTask[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      relations: ['questions'],
    });

    return QuizGenerationTaskMapper.toDomainList(entities);
  }

  private getRepository(
    entityManager?: EntityManager,
  ): Repository<QuizGenerationTaskEntity> {
    return entityManager || this.currentEntityManager
      ? (entityManager || this.currentEntityManager!).getRepository(
          QuizGenerationTaskEntity,
        )
      : this.quizGenerationTaskRepository;
  }
}
