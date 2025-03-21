import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsModule } from '../questions/questions.module';
import { QuizGenerationTasksModule } from '../quiz-generation-tasks/quiz-generation-tasks.module';
import { UsersModule } from '../users/users.module';
import { UserAnswersModule } from '../user-answers/user-answers.module';
import { UnitOfWorkModule } from '../unit-of-work/unit-of-work.module';
import { AnswerRepositoryImpl } from './answers/answer.repository';
import { AnswerEntity } from '../common/entities/answer.entity';

/**
 * RepositoriesModule consolidates all repository implementations
 * in a single module to simplify dependency injection.
 *
 * This module re-exports all repository implementations from their
 * respective domain modules, making them available through a single import.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AnswerEntity]),
    QuestionsModule,
    QuizGenerationTasksModule,
    UsersModule,
    UserAnswersModule,
    UnitOfWorkModule,
  ],
  providers: [AnswerRepositoryImpl],
  exports: [
    AnswerRepositoryImpl,
    QuestionsModule,
    QuizGenerationTasksModule,
    UsersModule,
    UserAnswersModule,
    UnitOfWorkModule,
  ],
})
export class RepositoriesModule {}
