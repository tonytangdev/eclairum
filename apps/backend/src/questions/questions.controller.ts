import { Controller, Get } from '@nestjs/common';
import { QuestionsService } from './services/questions.service';

@Controller('/users/:id/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}
  @Get()
  getQuestions() {
    return this.questionsService.getQuestions();
  }
}
