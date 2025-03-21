import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { QuizGenerationTask } from '@eclairum/core/entities';
import { QuizGenerationTaskRepository } from '@eclairum/core/interfaces';
import { QuizGenerationTaskEntity } from '../entities/quiz-generation-task.entity';
import { QuizGenerationTaskMapper } from '../mappers/quiz-generation-task.mapper';
import {
  PaginationParams,
  PaginatedResult,
} from '@eclairum/core/shared/pagination.interface';
import { UnitOfWorkService } from '../../../../unit-of-work/unit-of-work.service';

@Injectable()
export class QuizGenerationTaskRepositoryImpl
  implements QuizGenerationTaskRepository
{
  constructor(private readonly uowService: UnitOfWorkService) {}

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
  ): Promise<QuizGenerationTask> {
    const repo = this.getRepository();

    const quizGenerationTaskEntity =
      QuizGenerationTaskMapper.toEntity(quizGenerationTask);
    await repo.save(quizGenerationTaskEntity);

    return quizGenerationTask;
  }

  async findById(id: string): Promise<QuizGenerationTask | null> {
    const repo = this.getRepository();
    const quizGenerationTaskEntity = await repo.findOne({
      where: { id },
      relations: ['questions', 'questions.answers'],
    });

    if (!quizGenerationTaskEntity) {
      return null;
    }

    return QuizGenerationTaskMapper.toDomain(quizGenerationTaskEntity);
  }

  /**
   * Find all quiz generation tasks associated with a specific user
   * @param userId The ID of the user
   * @returns Promise that resolves to an array of quiz generation tasks
   */
  async findByUserId(userId: string): Promise<QuizGenerationTask[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      where: { userId },
      relations: ['questions'],
      order: { createdAt: 'DESC' }, // Return newest tasks first
    });

    return QuizGenerationTaskMapper.toDomainList(entities);
  }

  /**
   * Find quiz generation tasks associated with a specific user with pagination
   * @param userId The ID of the user
   * @param pagination Pagination parameters (page and limit)
   * @returns Promise that resolves to a paginated result of quiz generation tasks
   */
  async findByUserIdPaginated(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<QuizGenerationTask>> {
    const repo = this.getRepository();

    const skip = (pagination.page - 1) * pagination.limit;

    // Get total count for pagination metadata
    const totalItems = await repo.count({
      where: { userId },
    });

    // Get paginated results
    const entities = await repo.find({
      where: { userId },
      relations: ['questions'],
      order: { createdAt: 'DESC' },
      skip,
      take: pagination.limit,
    });

    const tasks = QuizGenerationTaskMapper.toDomainList(entities);

    const totalPages = Math.ceil(totalItems / pagination.limit);

    return {
      data: tasks,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        totalItems,
        totalPages,
      },
    };
  }

  async findAll(): Promise<QuizGenerationTask[]> {
    const repo = this.getRepository();
    const entities = await repo.find({
      relations: ['questions'],
    });

    return QuizGenerationTaskMapper.toDomainList(entities);
  }

  /**
   * Soft deletes a quiz generation task by ID
   * @param id The task ID
   */
  async softDelete(id: string): Promise<void> {
    const repo = this.getRepository();
    await repo.update({ id }, { deletedAt: new Date() });
  }

  private getRepository(): Repository<QuizGenerationTaskEntity> {
    return this.uowService.getManager().getRepository(QuizGenerationTaskEntity);
  }
}
