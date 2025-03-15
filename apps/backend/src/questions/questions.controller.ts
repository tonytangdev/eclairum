import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Optional,
} from '@nestjs/common';
import { QuestionsService } from './services/questions.service';

@Controller('/users/:id/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  async getQuestions(
    @Param('id') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true }))
    @Optional()
    limit?: number,
  ) {
    return this.questionsService.getQuestions(userId, limit);
  }
}
