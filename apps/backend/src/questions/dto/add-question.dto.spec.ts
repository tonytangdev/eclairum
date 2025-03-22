import 'reflect-metadata'; // Import reflect-metadata
import { validate } from 'class-validator';
import { AddQuestionDto } from './add-question.dto';
import { plainToInstance } from 'class-transformer';

describe('AddQuestionDto', () => {
  it('should validate successfully with valid data', async () => {
    // Arrange
    const dto = new AddQuestionDto();
    dto.userId = 'user-123';
    dto.taskId = 'task-123';
    dto.questionContent = 'What is the capital of France?';
    dto.answers = [
      { content: 'Paris', isCorrect: true },
      { content: 'London', isCorrect: false },
      { content: 'Berlin', isCorrect: false },
      { content: 'Madrid', isCorrect: false },
    ];

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('should fail validation when userId is missing', async () => {
    // Arrange
    const dto = new AddQuestionDto();
    dto.taskId = 'task-123';
    dto.questionContent = 'What is the capital of France?';
    dto.answers = [
      { content: 'Paris', isCorrect: true },
      { content: 'London', isCorrect: false },
      { content: 'Berlin', isCorrect: false },
      { content: 'Madrid', isCorrect: false },
    ];

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('userId');
  });

  it('should fail validation when taskId is missing', async () => {
    // Arrange
    const dto = new AddQuestionDto();
    dto.userId = 'user-123';
    dto.questionContent = 'What is the capital of France?';
    dto.answers = [
      { content: 'Paris', isCorrect: true },
      { content: 'London', isCorrect: false },
      { content: 'Berlin', isCorrect: false },
      { content: 'Madrid', isCorrect: false },
    ];

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('taskId');
  });

  it('should fail validation when questionContent is missing', async () => {
    // Arrange
    const dto = new AddQuestionDto();
    dto.userId = 'user-123';
    dto.taskId = 'task-123';
    dto.answers = [
      { content: 'Paris', isCorrect: true },
      { content: 'London', isCorrect: false },
      { content: 'Berlin', isCorrect: false },
      { content: 'Madrid', isCorrect: false },
    ];

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('questionContent');
  });

  it('should fail validation when questionContent is empty', async () => {
    // Arrange
    const dto = new AddQuestionDto();
    dto.userId = 'user-123';
    dto.taskId = 'task-123';
    dto.questionContent = '';
    dto.answers = [
      { content: 'Paris', isCorrect: true },
      { content: 'London', isCorrect: false },
      { content: 'Berlin', isCorrect: false },
      { content: 'Madrid', isCorrect: false },
    ];

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('questionContent');
  });

  it('should fail validation when answers are missing', async () => {
    // Arrange
    const dto = new AddQuestionDto();
    dto.userId = 'user-123';
    dto.taskId = 'task-123';
    dto.questionContent = 'What is the capital of France?';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('answers');
  });

  it('should fail validation when less than four answers are provided', async () => {
    // Arrange
    const dto = new AddQuestionDto();
    dto.userId = 'user-123';
    dto.taskId = 'task-123';
    dto.questionContent = 'What is the capital of France?';
    dto.answers = [
      { content: 'Paris', isCorrect: true },
      { content: 'London', isCorrect: false },
      { content: 'Berlin', isCorrect: false },
    ];

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('answers');
  });

  it('should fail validation when answer content is missing', async () => {
    // Arrange
    const dto = new AddQuestionDto();
    dto.userId = 'user-123';
    dto.taskId = 'task-123';
    dto.questionContent = 'What is the capital of France?';
    dto.answers = [
      { content: '', isCorrect: true },
      { content: 'London', isCorrect: false },
      { content: 'Berlin', isCorrect: false },
      { content: 'Madrid', isCorrect: false },
    ];

    // Act
    const errors = await validate(plainToInstance(AddQuestionDto, dto));

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('answers');
  });
});
