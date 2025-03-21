import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionEntity } from './infrastructure/relational/entities/question.entity';
import { QuestionRepositoryImpl } from '../repositories/questions/question.repository';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './services/questions.service';
import { UsersModule } from '../users/users.module';
import { UserAnswersModule } from '../user-answers/user-answers.module';
import { UnitOfWorkModule } from '../unit-of-work/unit-of-work.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionEntity]),
    UsersModule,
    QuestionsModule,
    UserAnswersModule,
    UnitOfWorkModule,
  ],
  controllers: [QuestionsController],
  providers: [QuestionRepositoryImpl, QuestionsService],
  exports: [QuestionRepositoryImpl, QuestionsService],
})
export class QuestionsModule {}
