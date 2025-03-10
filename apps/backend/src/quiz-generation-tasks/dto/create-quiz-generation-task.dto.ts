import { MAX_TEXT_LENGTH } from '@flash-me/core/constants/quiz.constants';
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
  @MaxLength(MAX_TEXT_LENGTH, {
    message: `Text cannot exceed ${MAX_TEXT_LENGTH} characters`,
  })
  text: string;

  /**
   * The ID of the user creating the quiz generation task
   * @example "user-123"
   */
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;
}
