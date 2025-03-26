import { MAX_TEXT_LENGTH } from '@eclairum/core/constants';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  Matches,
} from 'class-validator';

/**
 * DTO for creating a new quiz generation task
 */
export class CreateQuizGenerationTaskDto {
  /**
   * The text content to generate quiz questions from.
   * Required if isFileUpload is false, optional otherwise.
   * @example "The quick brown fox jumps over the lazy dog"
   */
  @IsString({ message: 'Text must be a string' })
  @ValidateIf((o: CreateQuizGenerationTaskDto) => o.isFileUpload !== true)
  @IsNotEmpty({ message: 'Text is required when not uploading a file' })
  @MinLength(10, { message: 'Text must be at least 10 characters' })
  @ValidateIf(
    (o: CreateQuizGenerationTaskDto) => o.text !== null && o.text !== undefined,
  )
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

  /**
   * Indicates if this is a file upload request.
   * When true, the text field is optional.
   * A file upload URL will be returned in the response.
   * @example false
   */
  @IsBoolean({ message: 'isFileUpload must be a boolean' })
  @IsOptional()
  isFileUpload?: boolean;

  /**
   * The file extension for the uploaded file (e.g., pdf, doc, txt).
   * Required if isFileUpload is true.
   * @example "pdf"
   */
  @IsString({ message: 'File extension must be a string' })
  @ValidateIf((o: CreateQuizGenerationTaskDto) => o.isFileUpload === true)
  @IsNotEmpty({ message: 'File extension is required when uploading a file' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'File extension should only contain alphanumeric characters',
  })
  @IsOptional()
  fileExtension?: string;
}
