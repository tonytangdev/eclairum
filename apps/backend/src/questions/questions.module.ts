import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionEntity } from './infrastructure/relational/entities/question.entity';
import { QuestionRepositoryImpl } from './infrastructure/relational/repositories/question.repository';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './services/questions.service';
import { UsersModule } from '../users/users.module';
import { UserAnswersModule } from '../user-answers/user-answers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionEntity]),
    UsersModule,
    QuestionsModule,
    UserAnswersModule,
  ],
  controllers: [QuestionsController],
  providers: [QuestionRepositoryImpl, QuestionsService],
  exports: [QuestionRepositoryImpl, QuestionsService],
})
export class QuestionsModule {}
