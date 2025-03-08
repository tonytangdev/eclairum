import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { faker } from '@faker-js/faker';

describe('CreateUserDto', () => {
  describe('Validation', () => {
    it('should pass with valid email', async () => {
      // Arrange
      const dto = new CreateUserDto();
      dto.email = faker.internet.email();

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should pass with valid email and optional id', async () => {
      // Arrange
      const dto = new CreateUserDto();
      dto.email = faker.internet.email();
      dto.id = faker.string.uuid();

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail with an invalid email format', async () => {
      // Arrange
      const dto = new CreateUserDto();
      dto.email = 'not-an-email';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail when email is empty', async () => {
      // Arrange
      const dto = new CreateUserDto();
      dto.email = '';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail when email is missing', async () => {
      // Arrange
      const dto = new CreateUserDto();
      // email is not set

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('should fail when id is not a string', async () => {
      // Arrange
      const dto = new CreateUserDto();
      dto.email = faker.internet.email();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (dto as any).id = 123; // Force invalid type

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('id');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass when id is undefined', async () => {
      // Arrange
      const dto = new CreateUserDto();
      dto.email = faker.internet.email();
      // id is undefined (optional)

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });
  });
});
