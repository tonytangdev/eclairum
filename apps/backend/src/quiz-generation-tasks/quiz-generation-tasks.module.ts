import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizGenerationTasksController } from './quiz-generation-tasks.controller';
import { QuizGenerationTasksService } from './services/quiz-generation-tasks.service';
import { QuestionsModule } from '../questions/questions.module';
import { AnswersModule } from '../answers/answers.module';
import {
  LLM_SERVICE_PROVIDER_KEY,
  OpenAILLMService,
} from './services/openai-llm.service';
import { OpenAIProvider } from './providers/openai.provider';
import { QuizGenerationTaskEntity } from './infrastructure/relational/entities/quiz-generation-task.entity';
import { QuizGenerationTaskRepositoryImpl } from './infrastructure/relational/repositories/quiz-generation-task.repository';
import { QuestionGenerationService } from './services/question-generation.service';
import { QuizEntityFactory } from './factories/quiz-entity.factory';
import { TransactionHelper } from '../shared/helpers/transaction.helper';
import { QuestionEntity } from '../questions/infrastructure/relational/entities/question.entity';
import { AnswerEntity } from '../answers/infrastructure/relational/entities/answer.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuizGenerationTaskEntity,
      QuestionEntity,
      AnswerEntity,
    ]),
    QuestionsModule,
    AnswersModule,
    UsersModule,
  ],
  controllers: [QuizGenerationTasksController],
  providers: [
    QuizGenerationTasksService,
    {
      provide: LLM_SERVICE_PROVIDER_KEY,
      useClass: OpenAILLMService,
    },
    OpenAIProvider,
    QuizGenerationTaskRepositoryImpl,
    QuestionGenerationService,
    QuizEntityFactory,
    TransactionHelper,
  ],
  exports: [QuizGenerationTasksService],
})
export class QuizGenerationTasksModule {}
