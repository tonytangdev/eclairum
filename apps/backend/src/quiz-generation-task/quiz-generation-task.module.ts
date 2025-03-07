import { Module } from '@nestjs/common';
import { QuizGenerationTaskController } from './quiz-generation-task.controller';

@Module({
  controllers: [QuizGenerationTaskController],
})
export class QuizGenerationTaskModule {}
