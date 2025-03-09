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
  constructor(
    @InjectRepository(QuizGenerationTaskEntity)
    private readonly quizGenerationTaskRepository: Repository<QuizGenerationTaskEntity>,
  ) {}

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
    const repo = entityManager
      ? entityManager.getRepository(QuizGenerationTaskEntity)
      : this.quizGenerationTaskRepository;

    const quizGenerationTaskEntity =
      QuizGenerationTaskMapper.toEntity(quizGenerationTask);
    await repo.save(quizGenerationTaskEntity);

    return quizGenerationTask;
  }

  async findById(id: string): Promise<QuizGenerationTask | null> {
    const quizGenerationTaskEntity =
      await this.quizGenerationTaskRepository.findOne({
        where: { id },
        relations: ['questions'],
      });

    if (!quizGenerationTaskEntity) {
      return null;
    }

    return QuizGenerationTaskMapper.toDomain(quizGenerationTaskEntity);
  }

  async findAll(): Promise<QuizGenerationTask[]> {
    const entities = await this.quizGenerationTaskRepository.find({
      relations: ['questions'],
    });

    return QuizGenerationTaskMapper.toDomainList(entities);
  }
}
