import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateQuizGenerationTaskDto } from './dto/create-quiz-generation-task.dto';
import { QuizGenerationTasksService } from './services/quiz-generation-tasks.service';

@Controller('quiz-generation-tasks')
export class QuizGenerationTasksController {
  constructor(
    private readonly quizGenerationTaskService: QuizGenerationTasksService,
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
