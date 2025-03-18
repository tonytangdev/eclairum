import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateQuizGenerationTaskDto } from './dto/create-quiz-generation-task.dto';
import { FetchQuizGenerationTasksDto } from './dto/fetch-quiz-generation-tasks.dto';
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

  @Get()
  @HttpCode(HttpStatus.OK)
  fetchQuizGenerationTasks(
    @Query() fetchQuizGenerationTasksDto: FetchQuizGenerationTasksDto,
  ) {
    return this.quizGenerationTaskService.fetchTasksByUserId(
      fetchQuizGenerationTasksDto,
    );
  }
}
