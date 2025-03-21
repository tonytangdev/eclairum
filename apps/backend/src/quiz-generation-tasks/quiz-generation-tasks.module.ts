import { Module } from '@nestjs/common';
import { QuizGenerationTasksController } from './quiz-generation-tasks.controller';
import { QuizGenerationTasksService } from './services/quiz-generation-tasks.service';
import {
  LLM_SERVICE_PROVIDER_KEY,
  OpenAILLMService,
} from './services/openai-llm.service';
import { OpenAIProvider } from './providers/openai.provider';
import { UnitOfWorkModule } from '../unit-of-work/unit-of-work.module';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [UnitOfWorkModule, RepositoriesModule],
  controllers: [QuizGenerationTasksController],
  providers: [
    QuizGenerationTasksService,
    {
      provide: LLM_SERVICE_PROVIDER_KEY,
      useClass: OpenAILLMService,
    },
    OpenAIProvider,
  ],
  exports: [QuizGenerationTasksService],
})
export class QuizGenerationTasksModule {}
