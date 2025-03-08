import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { QuestionRepository } from '@flash-me/core/interfaces/question-repository.interface';
import { Question } from '@flash-me/core/entities';
import { QuestionEntity } from '../entities/question.entity';
import { QuestionMapper } from '../mappers/question.mapper';

@Injectable()
export class QuestionRepositoryImpl implements QuestionRepository {
  constructor(
    @InjectRepository(QuestionEntity)
    private questionRepository: Repository<QuestionEntity>,
  ) {}

  async saveQuestions(
    questions: Question[],
    entityManager?: EntityManager,
  ): Promise<void> {
    const questionEntities = questions.map((question) =>
      QuestionMapper.toPersistence(question),
    );

    // Save all questions at once
    if (questionEntities.length > 0) {
      // Use provided entity manager if available, otherwise use default repository
      const repo = entityManager
        ? entityManager.getRepository(QuestionEntity)
        : this.questionRepository;
      await repo.save(questionEntities);
    }
  }
}
