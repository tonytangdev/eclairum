import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AnswerRepository } from '@eclairum/core/interfaces/answer-repository.interface';
import { Answer } from '@eclairum/core/entities';
import { AnswerEntity } from '../entities/answer.entity';
import { AnswerMapper } from '../mappers/answer.mapper';
import { UnitOfWorkService } from '../../../../unit-of-work/unit-of-work.service';

@Injectable()
export class AnswerRepositoryImpl implements AnswerRepository {
  constructor(private readonly uowService: UnitOfWorkService) {}

  async saveAnswers(answers: Answer[]): Promise<void> {
    if (answers.length === 0) return;

    const answerEntities = this.mapAnswersToPersistence(answers);
    const repository = this.getRepository();
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

  async softDeleteByQuestionId(questionId: string): Promise<void> {
    const repository = this.getRepository();

    await repository.update({ questionId }, { deletedAt: new Date() });
  }

  private mapAnswersToPersistence(answers: Answer[]): AnswerEntity[] {
    return answers.map((answer) => AnswerMapper.toPersistence(answer));
  }

  private getRepository(): Repository<AnswerEntity> {
    return this.uowService.getManager().getRepository(AnswerEntity);
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
