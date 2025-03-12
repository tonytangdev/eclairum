import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAnswerEntity } from '../entities/user-answer.entity';
import { UserAnswersRepository } from '@flash-me/core/interfaces/user-answers-repository.interface';
import { UserAnswer } from '@flash-me/core/entities';
import { UserAnswerMapper } from '../mappers/user-answer.mapper';

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

  private async findEntityById(id: string): Promise<UserAnswerEntity | null> {
    return this.userAnswerRepository.findOne({
      where: { id },
      relations: ['answer'],
    });
  }
}
