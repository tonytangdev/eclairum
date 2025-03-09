import { Module } from '@nestjs/common';
import { QuizGenerationTasksController } from './quiz-generation-tasks.controller';
import { QuizGenerationTasksService } from './services/quiz-generation-tasks.service';
import { QuestionsModule } from '../questions/questions.module';
import { AnswersModule } from '../answers/answers.module';
import { OpenAILLMService } from './services/openai-llm.service';

@Module({
  imports: [QuestionsModule, AnswersModule],
  controllers: [QuizGenerationTasksController],
  providers: [QuizGenerationTasksService, OpenAILLMService],
})
export class QuizGenerationTasksModule {}
