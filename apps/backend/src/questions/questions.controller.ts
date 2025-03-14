import { Controller, Get } from '@nestjs/common';

@Controller('questions')
export class QuestionsController {
  @Get()
  getQuestions() {
    return {
      data: [],
      metadata: {
        count: 0,
      },
      success: true,
    };
  }
}
