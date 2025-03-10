import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Server } from 'http';
import { faker } from '@faker-js/faker';
import { AppModule } from '../src/app.module';
import { CreateUserDto } from '../src/users/dto/create-user.dto';

// Define interfaces for all response types
interface UserResponseDto {
  user: {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface ErrorResponseDto {
  statusCode: number;
  message: string | string[];
  error: string;
}

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Apply the same pipes and middleware as in the main.ts file
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a new user and return 201', async () => {
      // Generate random email with faker
      const email = faker.internet.email().toLowerCase();
      const createUserDto: CreateUserDto = { email };

      const response = await request(httpServer)
        .post('/users')
        .send(createUserDto)
        .expect(201);

      // Assert response with proper typing
      const { user }: UserResponseDto = response.body as UserResponseDto;

      expect(user).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should return 400 when email is invalid', async () => {
      // Use faker to generate invalid email formats
      const invalidEmails = [
        faker.string.alphanumeric(8), // No @ symbol
        `@${faker.internet.domainName()}`, // Missing local part
        `${faker.internet.username()}@`, // Missing domain
        faker.string.sample(30), // Random string
      ];

      const invalidEmail = faker.helpers.arrayElement(invalidEmails);
      const createUserDto = { email: invalidEmail };

      const response = await request(httpServer)
        .post('/users')
        .send(createUserDto)
        .expect(400);

      // Assert response with proper typing
      const errorResponse: ErrorResponseDto = response.body as ErrorResponseDto;
      expect(errorResponse.message).toContain('email must be an email');
      expect(errorResponse.error).toBe('Bad Request');
    });

    it('should return 400 when missing required fields', async () => {
      // Make request with empty body
      const response = await request(httpServer)
        .post('/users')
        .send({})
        .expect(400);

      // Assert response with proper typing
      const errorResponse: ErrorResponseDto = response.body as ErrorResponseDto;
      expect(errorResponse.message).toContain('email should not be empty');
      expect(errorResponse.error).toBe('Bad Request');
    });

    it('should reject extra fields in the request body', async () => {
      // Use faker to generate random field names and values
      const email = faker.internet.email().toLowerCase();
      const randomFieldName = faker.word.sample();
      const randomValue = faker.helpers.arrayElement([
        faker.string.sample(),
        faker.number.int(),
        faker.datatype.boolean(),
        { [faker.word.sample()]: faker.word.sample() },
      ]);

      const createUserDto = {
        email,
        [randomFieldName]: randomValue,
      };

      const response = await request(httpServer)
        .post('/users')
        .send(createUserDto)
        .expect(400);

      // Assert response with proper typing
      const errorResponse: ErrorResponseDto = response.body as ErrorResponseDto;
      expect(errorResponse.message).toContain(
        `property ${randomFieldName} should not exist`,
      );
      expect(errorResponse.error).toBe('Bad Request');
    });

    it('should create different users with unique emails', async () => {
      // Create multiple users with different emails
      const emails = [
        faker.internet.email().toLowerCase(),
        faker.internet.email().toLowerCase(),
      ];

      // Create first user
      const firstResponse = await request(httpServer)
        .post('/users')
        .send({ email: emails[0] })
        .expect(201);

      const { user: firstUser }: UserResponseDto =
        firstResponse.body as UserResponseDto;
      expect(firstUser.email).toBe(emails[0]);

      // Create second user
      const secondResponse = await request(httpServer)
        .post('/users')
        .send({ email: emails[1] })
        .expect(201);

      const { user: secondUser }: UserResponseDto =
        secondResponse.body as UserResponseDto;
      expect(secondUser.email).toBe(emails[1]);

      // Verify they have different IDs
      expect(firstUser.id).not.toBe(secondUser.id);
    });
  });
});
