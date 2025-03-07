import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('quiz-generation-tasks')
export class QuizGenerationTaskController {
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  createQuizGenerationTask() {
    return;
  }
}
