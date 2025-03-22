import { validate } from 'class-validator';
import { EditAnswerDto } from './edit-answer.dto';

describe('EditAnswerDto', () => {
  it('should validate successfully with valid data', async () => {
    // Arrange
    const dto = new EditAnswerDto();
    dto.userId = 'user-123';
    dto.answerContent = 'Paris';
    dto.isCorrect = true;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when userId is missing', async () => {
    // Arrange
    const dto = new EditAnswerDto();
    dto.answerContent = 'Paris';
    dto.isCorrect = true;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('userId');
  });

  it('should fail validation when answerContent is missing', async () => {
    // Arrange
    const dto = new EditAnswerDto();
    dto.userId = 'user-123';
    dto.isCorrect = true;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('answerContent');
  });

  it('should fail validation when isCorrect is missing', async () => {
    // Arrange
    const dto = new EditAnswerDto();
    dto.userId = 'user-123';
    dto.answerContent = 'Paris';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('isCorrect');
  });

  it('should fail validation when answerContent is empty', async () => {
    // Arrange
    const dto = new EditAnswerDto();
    dto.userId = 'user-123';
    dto.answerContent = '';
    dto.isCorrect = true;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('answerContent');
  });
});
