import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizGenerationTasksModule } from '../quiz-generation-tasks/quiz-generation-tasks.module';
import { UserAnswersModule } from '../user-answers/user-answers.module';
import { UnitOfWorkModule } from '../unit-of-work/unit-of-work.module';
import { AnswerRepositoryImpl } from './answers/answer.repository';
import { AnswerEntity } from '../common/entities/answer.entity';
import { QuestionEntity } from '../common/entities/question.entity';
import { QuestionRepositoryImpl } from './questions/question.repository';
import { UserEntity } from '../common/entities/user.entity';
import { UserRepositoryImpl } from './users/user.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnswerEntity, QuestionEntity, UserEntity]),
    QuizGenerationTasksModule,
    UserAnswersModule,
    UnitOfWorkModule,
  ],
  providers: [AnswerRepositoryImpl, QuestionRepositoryImpl, UserRepositoryImpl],
  exports: [
    AnswerRepositoryImpl,
    QuestionRepositoryImpl,
    UserRepositoryImpl,
    QuizGenerationTasksModule,
    UserAnswersModule,
    UnitOfWorkModule,
  ],
})
export class RepositoriesModule {}
