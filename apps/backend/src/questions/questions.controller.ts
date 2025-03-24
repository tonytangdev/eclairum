import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Body,
  ParseIntPipe,
  Optional,
  Param,
} from '@nestjs/common';
import { QuestionsService } from './services/questions.service';
import { EditQuestionDto } from './dto/edit-question.dto';
import { AddQuestionDto } from './dto/add-question.dto';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async getQuestions(
    @Query('userId')
    userId: string,
    @Optional()
    @Query('limit', new ParseIntPipe({ optional: true }))
    limit?: number,
    @Optional()
    @Query('quizGenerationTaskId')
    quizGenerationTaskId?: string,
  ) {
    return this.questionsService.getQuestions(
      userId,
      limit,
      quizGenerationTaskId,
    );
  }

  @Post()
  async addQuestion(@Body() addQuestionDto: AddQuestionDto) {
    const { userId, taskId, questionContent, answers } = addQuestionDto;
    return this.questionsService.addQuestion(
      userId,
      taskId,
      questionContent,
      answers,
    );
  }

  @Put(':questionId')
  async editQuestion(
    @Body() editQuestionDto: EditQuestionDto,
    @Param('questionId') questionId: string,
  ) {
    const { userId, questionContent } = editQuestionDto;

    return this.questionsService.editQuestion(
      userId,
      questionId,
      questionContent,
    );
  }
}
