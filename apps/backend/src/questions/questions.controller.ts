import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  Optional,
  Param,
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
