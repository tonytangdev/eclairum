import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnswerRepository } from '@eclairum/core/interfaces/answer-repository.interface';
import { Answer } from '@eclairum/core/entities';
import { AnswerEntity } from '../../common/entities/answer.entity';
import { AnswerMapper } from './mappers/answer.mapper';

@Injectable()
export class AnswerRepositoryImpl implements AnswerRepository {
  constructor(
    @InjectRepository(AnswerEntity)
    private readonly answerRepository: Repository<AnswerEntity>,
  ) {}

  async saveAnswers(answers: Answer[]): Promise<void> {
    if (answers.length === 0) return;

    const answerEntities = answers.map((answer) =>
      AnswerMapper.toPersistence(answer),
    );
    await this.answerRepository.save(answerEntities);
  }

  async findByQuestionId(questionId: string): Promise<Answer[]> {
    const entities = await this.answerRepository.find({
      where: { questionId },
    });
    return entities.map((entity) => AnswerMapper.toDomain(entity));
  }

  async findById(id: string): Promise<Answer | null> {
    const entity = await this.answerRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return AnswerMapper.toDomain(entity);
  }

  async softDeleteByQuestionId(questionId: string): Promise<void> {
    await this.answerRepository.update(
      { questionId },
      { deletedAt: new Date() },
    );
  }

  async save(answer: Answer): Promise<void> {
    const answerEntity = AnswerMapper.toPersistence(answer);
    await this.answerRepository.save(answerEntity);
  }
}
