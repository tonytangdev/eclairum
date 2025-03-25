import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for resuming a quiz generation task after file upload
 */
export class ResumeQuizGenerationTaskDto {
  /**
   * The ID of the user who owns the task
   * @example "user-123"
   */
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;
}
