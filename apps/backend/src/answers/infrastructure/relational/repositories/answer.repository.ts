import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AnswerRepository } from '@eclairum/core/interfaces/answer-repository.interface';
import { Answer } from '@eclairum/core/entities';
import { AnswerEntity } from '../entities/answer.entity';
import { AnswerMapper } from '../mappers/answer.mapper';

@Injectable()
export class AnswerRepositoryImpl implements AnswerRepository {
  private currentEntityManager?: EntityManager | null;

  constructor(
    @InjectRepository(AnswerEntity)
    private answerRepository: Repository<AnswerEntity>,
  ) {}

  setEntityManager(entityManager: EntityManager | null): void {
    this.currentEntityManager = entityManager;
  }

  async saveAnswers(
    answers: Answer[],
    entityManager?: EntityManager,
  ): Promise<void> {
    if (answers.length === 0) return;

    const answerEntities = this.mapAnswersToPersistence(answers);
    const repository = this.getRepository(entityManager);
    await this.persistAnswers(repository, answerEntities);
  }

  async findByQuestionId(questionId: string): Promise<Answer[]> {
    const answerEntities = await this.queryAnswersByQuestionId(questionId);
    return this.mapEntitiesToDomain(answerEntities);
  }

  async findById(id: string): Promise<Answer | null> {
    const repository = this.getRepository();
    const entity = await repository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return AnswerMapper.toDomain(entity);
  }

  private mapAnswersToPersistence(answers: Answer[]): AnswerEntity[] {
    return answers.map((answer) => AnswerMapper.toPersistence(answer));
  }

  private getRepository(
    entityManager?: EntityManager,
  ): Repository<AnswerEntity> {
    return entityManager || this.currentEntityManager
      ? (entityManager || this.currentEntityManager!).getRepository(
          AnswerEntity,
        )
      : this.answerRepository;
  }

  private async persistAnswers(
    repository: Repository<AnswerEntity>,
    entities: AnswerEntity[],
  ): Promise<void> {
    await repository.save(entities);
  }

  private async queryAnswersByQuestionId(
    questionId: string,
  ): Promise<AnswerEntity[]> {
    const repository = this.getRepository();
    return await repository.find({ where: { questionId } });
  }

  private mapEntitiesToDomain(entities: AnswerEntity[]): Answer[] {
    return entities.map((entity) => AnswerMapper.toDomain(entity));
  }
}
