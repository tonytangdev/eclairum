import { validate } from 'class-validator';
import { EditQuestionDto } from './edit-question.dto';

describe('EditQuestionDto', () => {
  it('should validate successfully with valid data', async () => {
    // Arrange
    const dto = new EditQuestionDto();
    dto.userId = 'user-123';
    dto.questionId = 'question-123';
    dto.questionContent = 'What is the capital of France?';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when userId is missing', async () => {
    // Arrange
    const dto = new EditQuestionDto();
    dto.questionId = 'question-123';
    dto.questionContent = 'What is the capital of France?';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('userId');
  });

  it('should fail validation when questionId is missing', async () => {
    // Arrange
    const dto = new EditQuestionDto();
    dto.userId = 'user-123';
    dto.questionContent = 'What is the capital of France?';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('questionId');
  });

  it('should fail validation when questionContent is missing', async () => {
    // Arrange
    const dto = new EditQuestionDto();
    dto.userId = 'user-123';
    dto.questionId = 'question-123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('questionContent');
  });

  it('should fail validation when questionContent is empty', async () => {
    // Arrange
    const dto = new EditQuestionDto();
    dto.userId = 'user-123';
    dto.questionId = 'question-123';
    dto.questionContent = '';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('questionContent');
  });
});
