import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class FetchQuizGenerationTasksDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }: { value: string }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }: { value: string }) => parseInt(value))
  limit?: number = 10;
}
