import { Controller, Put, Body, Param } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { EditAnswerDto } from './dto/edit-answer.dto';

@Controller('answers')
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Put(':answerId')
  async updateAnswer(
    @Param('answerId') answerId: string,
    @Body() editAnswerDto: EditAnswerDto,
  ) {
    const { userId, answerContent, isCorrect } = editAnswerDto;

    return this.answersService.editAnswer(
      userId,
      answerId,
      answerContent,
      isCorrect,
    );
  }
}
