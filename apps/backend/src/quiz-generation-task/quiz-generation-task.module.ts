import { Module } from '@nestjs/common';
import { QuizGenerationTaskController } from './quiz-generation-task.controller';
import { QuizGenerationTaskService } from './services/quiz-generation-task.service';
import { QuestionsModule } from '../questions/questions.module';
import { AnswersModule } from '../answers/answers.module';

@Module({
  imports: [QuestionsModule, AnswersModule],
  controllers: [QuizGenerationTaskController],
  providers: [QuizGenerationTaskService],
})
export class QuizGenerationTaskModule {}
