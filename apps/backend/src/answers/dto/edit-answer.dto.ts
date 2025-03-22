import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';

/**
 * DTO for editing an answer
 */
export class EditAnswerDto {
  /**
   * The ID of the user editing the answer
   * @example "user-123"
   */
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  /**
   * The new content of the answer
   * @example "Paris"
   */
  @IsString({ message: 'Answer content must be a string' })
  @IsNotEmpty({ message: 'Answer content is required' })
  answerContent: string;

  /**
   * Indicates if the answer is correct
   * @example true
   */
  @IsBoolean({ message: 'IsCorrect must be a boolean' })
  @IsNotEmpty({ message: 'IsCorrect is required' })
  isCorrect: boolean;
}
