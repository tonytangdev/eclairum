import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { faker } from '@faker-js/faker';
import { ResumeQuizGenerationTaskDto } from './resume-quiz-generation-task.dto';

describe('ResumeQuizGenerationTaskDto', () => {
  let dto: ResumeQuizGenerationTaskDto;

  beforeEach(() => {
    dto = new ResumeQuizGenerationTaskDto();
    dto.userId = faker.string.alphanumeric(10);
  });

  it('should be defined', () => {
    expect(dto).toBeDefined();
  });

  describe('userId validation', () => {
    it('should validate with a valid string ID', async () => {
      // Arrange
      dto.userId = faker.string.alphanumeric(8);

      // Act
      const dtoObj = plainToInstance(ResumeQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate with numeric string ID', async () => {
      // Arrange
      dto.userId = faker.number.int({ min: 10000, max: 99999 }).toString();

      // Act
      const dtoObj = plainToInstance(ResumeQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate with UUID format', async () => {
      // Arrange
      dto.userId = faker.string.uuid();

      // Act
      const dtoObj = plainToInstance(ResumeQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when userId is empty', async () => {
      // Arrange
      dto.userId = '';

      // Act
      const dtoObj = plainToInstance(ResumeQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when userId is null', async () => {
      // Arrange
      // @ts-expect-error Set userId to null
      dto.userId = null;

      // Act
      const dtoObj = plainToInstance(ResumeQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when userId is undefined', async () => {
      // Arrange
      // @ts-expect-error Delete userId property
      delete dto.userId;

      // Act
      const dtoObj = plainToInstance(ResumeQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });
});
