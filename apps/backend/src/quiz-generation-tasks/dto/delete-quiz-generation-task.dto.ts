import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteQuizGenerationTaskDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
