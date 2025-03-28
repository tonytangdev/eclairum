import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { faker } from '@faker-js/faker';
import { CreateQuizGenerationTaskDto } from './create-quiz-generation-task.dto';
import { MAX_TEXT_LENGTH } from '@eclairum/core/constants';

describe('CreateQuizGenerationTaskDto', () => {
  let dto: CreateQuizGenerationTaskDto;

  beforeEach(() => {
    dto = new CreateQuizGenerationTaskDto();
    // Generate a paragraph with at least 10 characters
    dto.text = faker.lorem.paragraph();
    dto.userId = faker.string.alphanumeric(10);
  });

  it('should be defined', () => {
    expect(dto).toBeDefined();
  });

  describe('text validation', () => {
    it('should validate a valid dto', async () => {
      // Use faker to generate valid text
      dto.text = faker.lorem.paragraphs(2);

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when text is empty and isFileUpload is false', async () => {
      dto.text = '';
      dto.isFileUpload = false;

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should allow empty text when isFileUpload is true', async () => {
      dto.text = '';
      dto.isFileUpload = true;

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });

    it('should allow very short text when isFileUpload is true', async () => {
      dto.text = 'hi'; // Less than 10 characters
      dto.isFileUpload = true;

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });

    it('should allow undefined text when isFileUpload is true', async () => {
      // @ts-expect-error Delete text property
      delete dto.text;
      dto.isFileUpload = true;

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });

    it('should pass validation when isFileUpload is true and text is empty', async () => {
      const dto = new CreateQuizGenerationTaskDto();
      dto.userId = 'user-123';
      dto.isFileUpload = true;
      dto.text = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when text is empty', async () => {
      dto.text = '';

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation when isFileUpload is false and text is empty', async () => {
      const dto = new CreateQuizGenerationTaskDto();
      dto.userId = 'user-123';
      dto.isFileUpload = false;
      dto.text = '';

      const errors = await validate(dto);
      expect(errors).not.toHaveLength(0);
    });

    it('should fail validation when text is too short', async () => {
      dto.text = 'Too short'; // Less than 10 characters

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail validation when text is too long', async () => {
      dto.text = faker.string.sample(MAX_TEXT_LENGTH + 200);

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should validate with exactly minimum length', async () => {
      // Generate exactly 10 characters
      dto.text = faker.string.alpha(10);

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });

    it('should pass validation with text of medium length', async () => {
      // Generate random text with a controlled length
      dto.text = faker.lorem.paragraphs(3);

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });
  });

  describe('userId validation', () => {
    it('should validate with a valid string ID', async () => {
      // Use faker to generate a random alphanumeric string
      dto.userId = faker.string.alphanumeric(8);

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });

    it('should validate with numeric string ID', async () => {
      // Use faker to generate a numeric string
      dto.userId = faker.number.int({ min: 10000, max: 99999 }).toString();

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });

    it('should validate with UUID format if provided', async () => {
      dto.userId = faker.string.uuid();

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });

    it('should validate with mixed format user IDs', async () => {
      // Generate a mixed format ID like "user-123-abc"
      dto.userId = `user-${faker.number.int(1000)}-${faker.string.alpha(3)}`;

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when userId is empty', async () => {
      dto.userId = '';

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when userId is null', async () => {
      // @ts-expect-error Set userId to null
      dto.userId = null;

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when userId is undefined', async () => {
      // Delete the userId property
      // @ts-expect-error Delete userId property
      delete dto.userId;

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('isFileUpload validation', () => {
    it('should validate when isFileUpload is true', async () => {
      dto.isFileUpload = true;

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });

    it('should validate when isFileUpload is false', async () => {
      dto.isFileUpload = false;

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });

    it('should validate when isFileUpload is undefined', async () => {
      // isFileUpload is optional, so it should pass validation when undefined
      dto.isFileUpload = undefined;

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when isFileUpload is not a boolean', async () => {
      // @ts-expect-error Setting non-boolean value
      dto.isFileUpload = 'not-a-boolean';

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isBoolean');
    });
  });

  describe('conditional validation', () => {
    it('should apply text validations when isFileUpload is false', async () => {
      dto.text = 'Too short'; // Less than 10 characters
      dto.isFileUpload = false;

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should not apply text length validations when isFileUpload is true', async () => {
      dto.text = 'Short'; // Less than 10 characters
      dto.isFileUpload = true;

      const dtoObj = plainToInstance(CreateQuizGenerationTaskDto, dto);
      const errors = await validate(dtoObj);

      expect(errors.length).toBe(0);
    });
  });
});
