import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Delete,
} from '@nestjs/common';
import { CreateQuizGenerationTaskDto } from './dto/create-quiz-generation-task.dto';
import { FetchQuizGenerationTasksDto } from './dto/fetch-quiz-generation-tasks.dto';
import { FetchQuizGenerationTaskDto } from './dto/fetch-quiz-generation-task.dto';
import { DeleteQuizGenerationTaskDto } from './dto/delete-quiz-generation-task.dto';
import { ResumeQuizGenerationTaskDto } from './dto/resume-quiz-generation-task.dto';
import { QuizGenerationTasksService } from './services/quiz-generation-tasks.service';

@Controller('quiz-generation-tasks')
export class QuizGenerationTasksController {
  constructor(
    private readonly quizGenerationTaskService: QuizGenerationTasksService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createQuizGenerationTask(
    @Body() createQuizGenerationTaskDto: CreateQuizGenerationTaskDto,
  ) {
    const task = await this.quizGenerationTaskService.createTask(
      createQuizGenerationTaskDto,
    );

    return task;
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

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getQuizGenerationTask(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    id: string,
    @Query() fetchQuizGenerationTaskDto: FetchQuizGenerationTaskDto,
  ) {
    return this.quizGenerationTaskService.getTaskById(
      id,
      fetchQuizGenerationTaskDto.userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteQuizGenerationTask(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    id: string,
    @Query() deleteQuizGenerationTaskDto: DeleteQuizGenerationTaskDto,
  ) {
    return this.quizGenerationTaskService.deleteTask(
      id,
      deleteQuizGenerationTaskDto.userId,
    );
  }

  /**
   * Resume a quiz generation task after file upload
   * @param id The ID of the task to resume
   * @param resumeQuizGenerationTaskDto DTO containing the user ID
   * @returns The resumed task if successful
   */
  @Post(':id/resume')
  @HttpCode(HttpStatus.ACCEPTED)
  async resumeQuizGenerationTask(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    id: string,
    @Query() resumeQuizGenerationTaskDto: ResumeQuizGenerationTaskDto,
  ) {
    return this.quizGenerationTaskService.resumeTask(
      id,
      resumeQuizGenerationTaskDto.userId,
    );
  }
}
