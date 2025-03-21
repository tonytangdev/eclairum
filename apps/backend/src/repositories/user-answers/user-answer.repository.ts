import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAnswersRepository } from '@eclairum/core/interfaces/user-answers-repository.interface';
import { UserAnswer } from '@eclairum/core/entities';
import { UserAnswerMapper } from './mappers/user-answer.mapper';
import { UserAnswerEntity } from '../../common/entities/user-answer.entity';

@Injectable()
export class UserAnswerRepositoryImpl implements UserAnswersRepository {
  constructor(
    @InjectRepository(UserAnswerEntity)
    private readonly userAnswerRepository: Repository<UserAnswerEntity>,
  ) {}

  async findById(id: UserAnswer['id']): Promise<UserAnswer | null> {
    const entity = await this.findEntityById(id);

    if (!entity) {
      return null;
    }

    return UserAnswerMapper.toDomain(entity);
  }

  async save(userAnswer: UserAnswer): Promise<UserAnswer> {
    const entity = UserAnswerMapper.toPersistence(userAnswer);
    await this.userAnswerRepository.save(entity);
    return userAnswer;
  }

  async findAnsweredQuestionIds(userId: string): Promise<string[]> {
    const result = (await this.userAnswerRepository
      .createQueryBuilder('userAnswer')
      .select('DISTINCT userAnswer.questionId', 'questionId')
      .where('userAnswer.userId = :userId', { userId })
      .getRawMany()) as unknown as { questionId: string }[];

    return result.map((item) => item.questionId);
  }

  async findQuestionAnswerFrequencies(
    userId: string,
  ): Promise<Map<string, number>> {
    const result = (await this.userAnswerRepository
      .createQueryBuilder('userAnswer')
      .select('userAnswer.questionId', 'questionId')
      .addSelect('COUNT(userAnswer.id)', 'frequency')
      .where('userAnswer.userId = :userId', { userId })
      .groupBy('userAnswer.questionId')
      .getRawMany()) as unknown as { questionId: string; frequency: string }[];

    const frequencyMap = new Map<string, number>();

    result.forEach((item) => {
      frequencyMap.set(item.questionId, parseInt(item.frequency, 10));
    });

    return frequencyMap;
  }

  private async findEntityById(id: string): Promise<UserAnswerEntity | null> {
    return this.userAnswerRepository.findOne({
      where: { id },
      relations: ['answer'],
    });
  }
}
