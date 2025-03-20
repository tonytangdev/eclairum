import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for fetching a single quiz generation task by ID
 */
export class FetchQuizGenerationTaskDto {
  /**
   * The ID of the user requesting the quiz generation task
   * @example "user-123"
   */
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;
}
