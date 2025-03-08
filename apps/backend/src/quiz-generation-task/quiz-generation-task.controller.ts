import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateQuizGenerationTaskDto } from './dto/create-quiz-generation-task.dto';
import { QuizGenerationTaskService } from './services/quiz-generation-task.service';

@Controller('quiz-generation-tasks')
export class QuizGenerationTaskController {
  constructor(
    private readonly quizGenerationTaskService: QuizGenerationTaskService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  createQuizGenerationTask(
    @Body() createQuizGenerationTaskDto: CreateQuizGenerationTaskDto,
  ) {
    return this.quizGenerationTaskService.createTask(
      createQuizGenerationTaskDto,
    );
  }
}
