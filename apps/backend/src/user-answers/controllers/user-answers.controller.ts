import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserAnswersService } from '../services/user-answers.service';
import { SubmitAnswerDto } from '../dtos/submit-answer.dto';

@Controller('user-answers')
export class UserAnswersController {
  constructor(private readonly userAnswersService: UserAnswersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submitAnswer(@Body() submitAnswerDto: SubmitAnswerDto): Promise<void> {
    await this.userAnswersService.submitAnswer(submitAnswerDto);
  }
}
