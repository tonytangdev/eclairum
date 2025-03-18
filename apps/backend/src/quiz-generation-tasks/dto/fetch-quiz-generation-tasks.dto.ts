import { IsNotEmpty, IsString } from 'class-validator';

export class FetchQuizGenerationTasksDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
