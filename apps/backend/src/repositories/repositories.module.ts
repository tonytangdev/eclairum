import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfWorkModule } from '../unit-of-work/unit-of-work.module';
import { AnswerRepositoryImpl } from './answers/answer.repository';
import { AnswerEntity } from '../common/entities/answer.entity';
import { QuestionEntity } from '../common/entities/question.entity';
import { QuestionRepositoryImpl } from './questions/question.repository';
import { UserEntity } from '../common/entities/user.entity';
import { UserRepositoryImpl } from './users/user.repository';
import { UserAnswerEntity } from '../common/entities/user-answer.entity';
import { UserAnswerRepositoryImpl } from './user-answers/user-answer.repository';
import { QuizGenerationTaskEntity } from '../common/entities/quiz-generation-task.entity';
import { QuizGenerationTaskRepositoryImpl } from './quiz-generation-tasks/quiz-generation-task.repository';
import { FileEntity } from '../common/entities/file.entity';
import { FileRepositoryImpl } from './files/file.repository';
import { SubscriptionEntity } from '../common/entities/subscription.entity';
import { SubscriptionRepositoryImpl } from './subscriptions/subscription.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnswerEntity,
      QuestionEntity,
      UserEntity,
      UserAnswerEntity,
      QuizGenerationTaskEntity,
      FileEntity,
      SubscriptionEntity,
    ]),
    UnitOfWorkModule,
  ],
  providers: [
    AnswerRepositoryImpl,
    QuestionRepositoryImpl,
    UserRepositoryImpl,
    UserAnswerRepositoryImpl,
    QuizGenerationTaskRepositoryImpl,
    FileRepositoryImpl,
    SubscriptionRepositoryImpl,
  ],
  exports: [
    AnswerRepositoryImpl,
    QuestionRepositoryImpl,
    UserRepositoryImpl,
    UserAnswerRepositoryImpl,
    QuizGenerationTaskRepositoryImpl,
    FileRepositoryImpl,
    SubscriptionRepositoryImpl,
    UnitOfWorkModule,
  ],
})
export class RepositoriesModule {}
