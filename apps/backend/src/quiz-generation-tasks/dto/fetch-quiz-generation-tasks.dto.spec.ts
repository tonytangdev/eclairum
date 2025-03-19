import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { faker } from '@faker-js/faker';
import { FetchQuizGenerationTasksDto } from './fetch-quiz-generation-tasks.dto';

describe('FetchQuizGenerationTasksDto', () => {
  let dto: FetchQuizGenerationTasksDto;

  beforeEach(() => {
    dto = new FetchQuizGenerationTasksDto();
    dto.userId = faker.string.alphanumeric(10);
    // Default values for page and limit are set in the class definition
  });

  it('should be defined', () => {
    expect(dto).toBeDefined();
  });

  describe('userId validation', () => {
    it('should validate with a valid string ID', async () => {
      // Arrange
      dto.userId = faker.string.alphanumeric(8);

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate with numeric string ID', async () => {
      // Arrange
      dto.userId = faker.number.int({ min: 10000, max: 99999 }).toString();

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when userId is empty', async () => {
      // Arrange
      dto.userId = '';

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
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
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
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
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('page validation', () => {
    it('should use default value when page is not provided', async () => {
      // Arrange - no explicit page value set

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
      expect(dtoObj.page).toBe(1);
    });

    it('should validate with valid page number', async () => {
      // Arrange
      dto.page = 5;

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when page is less than 1', async () => {
      // Arrange
      dto.page = 0;

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });
  });

  describe('limit validation', () => {
    it('should use default value when limit is not provided', async () => {
      // Arrange - no explicit limit value set

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
      expect(dtoObj.limit).toBe(10);
    });

    it('should validate with valid limit number', async () => {
      // Arrange
      dto.limit = 50;

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate with minimum limit value', async () => {
      // Arrange
      dto.limit = 1;

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate with maximum limit value', async () => {
      // Arrange
      dto.limit = 100;

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when limit is less than 1', async () => {
      // Arrange
      dto.limit = 0;

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail validation when limit is greater than 100', async () => {
      // Arrange
      dto.limit = 101;

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('max');
    });
  });

  describe('combined validation', () => {
    it('should validate with all valid values', async () => {
      // Arrange
      dto.userId = faker.string.uuid();
      dto.page = 2;
      dto.limit = 25;

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate when only userId is provided', async () => {
      // Arrange
      dto.userId = faker.string.uuid();
      delete dto.page;
      delete dto.limit;

      // Act
      const dtoObj = plainToInstance(FetchQuizGenerationTasksDto, dto);
      const errors = await validate(dtoObj);

      // Assert
      expect(errors.length).toBe(0);
      expect(dtoObj.page).toBe(1);
      expect(dtoObj.limit).toBe(10);
    });
  });
});
