import { Module } from '@nestjs/common';
import { AnswersModule } from '../answers/answers.module';
import { QuestionsModule } from '../questions/questions.module';
import { QuizGenerationTasksModule } from '../quiz-generation-tasks/quiz-generation-tasks.module';
import { UsersModule } from '../users/users.module';
import { UserAnswersModule } from '../user-answers/user-answers.module';
import { UnitOfWorkModule } from '../unit-of-work/unit-of-work.module';

/**
 * RepositoriesModule consolidates all repository implementations
 * in a single module to simplify dependency injection.
 *
 * This module re-exports all repository implementations from their
 * respective domain modules, making them available through a single import.
 */
@Module({
  imports: [
    AnswersModule,
    QuestionsModule,
    QuizGenerationTasksModule,
    UsersModule,
    UserAnswersModule,
    UnitOfWorkModule,
  ],
  exports: [
    AnswersModule,
    QuestionsModule,
    QuizGenerationTasksModule,
    UsersModule,
    UserAnswersModule,
    UnitOfWorkModule,
  ],
})
export class RepositoriesModule {}
