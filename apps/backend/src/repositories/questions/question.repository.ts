import { Injectable } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { QuestionRepository } from '@eclairum/core/interfaces/question-repository.interface';
import { Question, User } from '@eclairum/core/entities';
import { UnitOfWorkService } from '../../unit-of-work/unit-of-work.service';
import { QuestionEntity } from '../../common/entities/question.entity';
import { QuestionMapper } from './mappers/question.mapper';
import { QuizGenerationTask } from '@eclairum/core/entities/quiz-generation-task';

@Injectable()
export class QuestionRepositoryImpl implements QuestionRepository {
  constructor(private readonly uowService: UnitOfWorkService) {}

  async saveQuestions(questions: Question[]): Promise<void> {
    if (questions.length === 0) return;
    const questionEntities = this.mapQuestionsToEntities(questions);
    const repository = this.getRepository();
    await this.persistQuestions(repository, questionEntities);
  }

  async findById(id: string): Promise<Question | null> {
    const repository = this.getRepository();
    const questionEntity = await repository.findOne({
      where: { id },
      relations: ['answers'],
    });

    if (!questionEntity) {
      return null;
    }

    return QuestionMapper.toDomain(questionEntity);
  }

  async findByUserId(userId: User['id']): Promise<Question[]> {
    const repository = this.getRepository();
    const questionEntities = await repository.find({
      where: { quizGenerationTask: { user: { id: userId } } },
      relations: ['answers'],
    });

    return questionEntities.map((entity) => QuestionMapper.toDomain(entity));
  }

  async findByQuizGenerationTaskId(
    taskId: QuizGenerationTask['id'],
  ): Promise<Question[]> {
    const repository = this.getRepository();
    const questionEntities = await repository.find({
      where: {
        quizGenerationTaskId: taskId,
        deletedAt: IsNull(),
      },
      relations: ['answers'],
    });

    return questionEntities.map((entity) => QuestionMapper.toDomain(entity));
  }

  async save(question: Question): Promise<Question> {
    const questionEntity = QuestionMapper.toPersistence(question);
    const repository = this.getRepository();

    const savedEntity = await repository.save(questionEntity);

    return QuestionMapper.toDomain(savedEntity);
  }

  async softDeleteByTaskId(taskId: string): Promise<void> {
    const repository = this.getRepository();

    await repository.update(
      { quizGenerationTaskId: taskId },
      { deletedAt: new Date() },
    );
  }

  private mapQuestionsToEntities(questions: Question[]): QuestionEntity[] {
    return questions.map((question) => QuestionMapper.toPersistence(question));
  }

  private getRepository(): Repository<QuestionEntity> {
    return this.uowService.getManager().getRepository(QuestionEntity);
  }

  private async persistQuestions(
    repository: Repository<QuestionEntity>,
    entities: QuestionEntity[],
  ): Promise<void> {
    await repository.save(entities);
  }
}
