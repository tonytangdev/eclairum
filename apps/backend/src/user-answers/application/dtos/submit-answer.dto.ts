import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @IsUUID()
  @IsNotEmpty()
  answerId: string;
}
