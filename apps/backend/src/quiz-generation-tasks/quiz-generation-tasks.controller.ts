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
import {
  PaginatedTasksResponse,
  TaskResponse,
  TaskSummaryResponse,
} from './dto/fetch-quiz-generation-tasks.response.dto';
import { TaskDetailResponse } from './dto/fetch-quiz-generation-task.response.dto';

@Controller('quiz-generation-tasks')
export class QuizGenerationTasksController {
  constructor(
    private readonly quizGenerationTaskService: QuizGenerationTasksService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createQuizGenerationTask(
    @Body() createQuizGenerationTaskDto: CreateQuizGenerationTaskDto,
  ): Promise<TaskResponse> {
    return this.quizGenerationTaskService.createTask(
      createQuizGenerationTaskDto,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  fetchQuizGenerationTasks(
    @Query() fetchQuizGenerationTasksDto: FetchQuizGenerationTasksDto,
  ): Promise<PaginatedTasksResponse> {
    return this.quizGenerationTaskService.fetchTasksByUserId(
      fetchQuizGenerationTasksDto,
    );
  }

  /**
   * Fetch ongoing quiz generation tasks for a specific user
   * @param userId The ID of the user
   * @returns Array of ongoing task summaries
   */
  @Get('ongoing')
  @HttpCode(HttpStatus.OK)
  fetchOngoingQuizGenerationTasks(
    @Query('userId') userId: string,
  ): Promise<TaskSummaryResponse[]> {
    return this.quizGenerationTaskService.fetchOngoingTasksByUserId(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getQuizGenerationTask(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    id: string,
    @Query() fetchQuizGenerationTaskDto: FetchQuizGenerationTaskDto,
  ): Promise<TaskDetailResponse> {
    return this.quizGenerationTaskService.getTaskById(
      id,
      fetchQuizGenerationTaskDto.userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteQuizGenerationTask(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    id: string,
    @Query() deleteQuizGenerationTaskDto: DeleteQuizGenerationTaskDto,
  ): Promise<{ success: boolean }> {
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
  resumeQuizGenerationTask(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    id: string,
    @Query() resumeQuizGenerationTaskDto: ResumeQuizGenerationTaskDto,
  ): Promise<{ success: boolean; task: TaskDetailResponse }> {
    return this.quizGenerationTaskService.resumeTask(
      id,
      resumeQuizGenerationTaskDto.userId,
    );
  }
}
