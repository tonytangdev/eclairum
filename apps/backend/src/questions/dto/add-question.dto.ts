import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsString({ message: 'Answer content must be a string' })
  @IsNotEmpty({ message: 'Answer content is required' })
  content: string;

  @IsBoolean({ message: 'isCorrect must be a boolean' })
  isCorrect: boolean;
}

/**
 * DTO for adding a question
 */
export class AddQuestionDto {
  /**
   * The ID of the user adding the question
   * @example "user-123"
   */
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  /**
   * The ID of the task associated with the question
   * @example "task-123"
   */
  @IsString({ message: 'Task ID must be a string' })
  @IsNotEmpty({ message: 'Task ID is required' })
  taskId: string;

  /**
   * The content of the question
   * @example "What is the capital of France?"
   */
  @IsString({ message: 'Question content must be a string' })
  @IsNotEmpty({ message: 'Question content is required' })
  questionContent: string;

  /**
   * The list of answers for the question
   */
  @ValidateNested({ each: true })
  @ArrayMinSize(4, { message: 'At least four answers are required' })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
