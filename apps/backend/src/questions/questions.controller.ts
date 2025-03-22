import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Body,
  ParseIntPipe,
  Optional,
} from '@nestjs/common';
import { QuestionsService } from './services/questions.service';
import { EditQuestionDto } from './dto/edit-question.dto'; // Import the new DTO

interface AddQuestionDto {
  userId: string;
  taskId: string;
  questionContent: string;
  answers: {
    content: string;
    isCorrect: boolean;
  }[];
}

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
  ) {
    return this.questionsService.getQuestions(userId, limit);
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

  @Put()
  async editQuestion(@Body() editQuestionDto: EditQuestionDto) {
    const { userId, questionId, questionContent } = editQuestionDto;
    return this.questionsService.editQuestion(
      userId,
      questionId,
      questionContent,
    );
  }
}
