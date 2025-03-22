import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for editing a question
 */
export class EditQuestionDto {
  /**
   * The ID of the user editing the question
   * @example "user-123"
   */
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  /**
   * The ID of the question being edited
   * @example "question-123"
   */
  @IsString({ message: 'Question ID must be a string' })
  @IsNotEmpty({ message: 'Question ID is required' })
  questionId: string;

  /**
   * The new content of the question
   * @example "What is the capital of France?"
   */
  @IsString({ message: 'Question content must be a string' })
  @IsNotEmpty({ message: 'Question content is required' })
  questionContent: string;
}
