import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Optional,
} from '@nestjs/common';
import { QuestionsService } from './services/questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async getQuestions(
    @Query('limit', new ParseIntPipe({ optional: true }))
    @Query('userId')
    userId: string,
    @Optional()
    limit?: number,
  ) {
    return this.questionsService.getQuestions(userId, limit);
  }
}
