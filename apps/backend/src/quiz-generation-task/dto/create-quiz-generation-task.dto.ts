import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO for creating a new quiz generation task
 */
export class CreateQuizGenerationTaskDto {
  /**
   * The text content to generate quiz questions from
   * @example "The quick brown fox jumps over the lazy dog"
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Text must be at least 10 characters' })
  @MaxLength(50000, { message: 'Text cannot exceed 50000 characters' })
  text: string;

  /**
   * The ID of the user creating the quiz generation task
   * @example "user-123"
   */
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;
}
