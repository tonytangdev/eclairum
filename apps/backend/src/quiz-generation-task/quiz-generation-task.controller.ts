import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateQuizGenerationTaskDto } from './dto/create-quiz-generation-task.dto';

@Controller('quiz-generation-tasks')
export class QuizGenerationTaskController {
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  createQuizGenerationTask(
    @Body() createQuizGenerationTaskDto: CreateQuizGenerationTaskDto,
  ) {
    // In a complete implementation, we would pass this to a service
    // that would process the task
    return {
      message: 'Quiz generation task created',
      textLength: createQuizGenerationTaskDto.text.length,
    };
  }
}
