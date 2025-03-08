import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnswerRepository } from '@flash-me/core/interfaces/answer-repository.interface';
import { Answer } from '@flash-me/core/entities';
import { AnswerEntity } from '../entities/answer.entity';
import { AnswerMapper } from '../mappers/answer.mapper';

@Injectable()
export class AnswerRepositoryImpl implements AnswerRepository {
  constructor(
    @InjectRepository(AnswerEntity)
    private answerRepository: Repository<AnswerEntity>,
  ) {}

  async saveAnswers(answers: Answer[]): Promise<void> {
    const answerEntities = answers.map((answer) =>
      AnswerMapper.toPersistence(answer),
    );

    // Save all answers at once
    if (answerEntities.length > 0) {
      await this.answerRepository.save(answerEntities);
    }
  }

  /**
   * Finds all answers for a specific question
   * @param questionId The ID of the question to find answers for
   * @returns Array of Answer domain objects
   */
  async findByQuestionId(questionId: string): Promise<Answer[]> {
    const answerEntities = await this.answerRepository.find({
      where: { questionId },
    });

    return answerEntities.map((entity) => AnswerMapper.toDomain(entity));
  }
}
