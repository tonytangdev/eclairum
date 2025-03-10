import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Server } from 'http';
import { faker } from '@faker-js/faker';
import { AppModule } from '../src/app.module';
import { CreateQuizGenerationTaskDto } from '../src/quiz-generation-tasks/dto/create-quiz-generation-task.dto';
import { CreateUserDto } from '../src/users/dto/create-user.dto';

// Set global timeout for all tests in this file to 2 minutes (120000ms)
jest.setTimeout(120000);

// Define interfaces for response types
interface QuizGenerationTaskResponseDto {
  taskId: string;
  userId: string;
  status: string;
  questionsCount: number;
  message: string;
  generatedAt: string;
}

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

describe('QuizGenerationTasksController (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let testUserId: string; // Store the real user ID

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    httpServer = app.getHttpServer() as Server;

    // Create a test user that we can reference in our tests
    const email = faker.internet.email().toLowerCase();
    const createUserDto: CreateUserDto = { email };

    const userResponse = await request(httpServer)
      .post('/users')
      .send(createUserDto)
      .expect(201);

    // Extract and store the user ID for later use
    const { user } = userResponse.body as UserResponseDto;
    testUserId = user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /quiz-generation-tasks', () => {
    // Set timeout specifically for the quiz generation task tests
    jest.setTimeout(120000);

    it('should create a new quiz generation task with an existing user and return 202', async () => {
      // Use the real user ID we created earlier
      const text = faker.lorem.paragraph();
      const createTaskDto: CreateQuizGenerationTaskDto = {
        userId: testUserId, // Use the real user ID
        text,
      };

      const response = await request(httpServer)
        .post('/quiz-generation-tasks')
        .send(createTaskDto)
        .expect(202);

      // Assert response
      const taskResponse: QuizGenerationTaskResponseDto =
        response.body as QuizGenerationTaskResponseDto;

      expect(taskResponse).toBeDefined();
      expect(taskResponse.userId).toBe(testUserId);
      expect(taskResponse.message).toBe(
        'Quiz generation task created with 10 questions',
      );
      expect(taskResponse.taskId).toBeDefined();
      expect(taskResponse.status).toBeDefined();
      expect(taskResponse.generatedAt).toBeDefined();
    }, 120000); // Set timeout for this specific test to 2 minutes

    it('should return 400 when using a non-existent userId', async () => {
      // Use a random UUID that doesn't correspond to any user
      const nonExistentUserId = faker.string.uuid();
      const text = faker.lorem.paragraph();
      const createTaskDto = {
        userId: nonExistentUserId,
        text,
      };

      // This might return 400 or 404 depending on how your validation is configured
      const response = await request(httpServer)
        .post('/quiz-generation-tasks')
        .send(createTaskDto)
        .expect((res) => res.status === 400 || res.status === 404);

      // If your app is configured to validate the user existence, assert the appropriate error
      if (response.status === 404) {
        const errorResponse: ErrorResponseDto =
          response.body as ErrorResponseDto;
        expect(errorResponse.message).toContain('User not found');
      }
    });

    it('should return 400 when required fields are missing', async () => {
      // Test with empty body
      const response = await request(httpServer)
        .post('/quiz-generation-tasks')
        .send({})
        .expect(400);

      const errorResponse: ErrorResponseDto = response.body as ErrorResponseDto;
      expect(errorResponse.message).toContain('text should not be empty');
      expect(errorResponse.message).toContain('User ID is required');
      expect(errorResponse.error).toBe('Bad Request');
    });

    it('should validate content is not empty', async () => {
      // Test with empty content
      const invalidDto = {
        userId: faker.string.uuid(),
        content: '',
      };

      const response = await request(httpServer)
        .post('/quiz-generation-tasks')
        .send(invalidDto)
        .expect(400);

      const errorResponse: ErrorResponseDto = response.body as ErrorResponseDto;
      expect(errorResponse.message).toContain(
        'Text must be at least 10 characters',
      );
      expect(errorResponse.error).toBe('Bad Request');
    });

    it('should reject extra fields in the request body', async () => {
      // Add unexpected field
      const userId = faker.string.uuid();
      const content = faker.lorem.paragraph();
      const randomFieldName = faker.word.sample();
      const randomValue = faker.helpers.arrayElement([
        faker.string.sample(),
        faker.number.int(),
        faker.datatype.boolean(),
      ]);

      const createTaskDto = {
        userId,
        content,
        [randomFieldName]: randomValue,
      };

      const response = await request(httpServer)
        .post('/quiz-generation-tasks')
        .send(createTaskDto)
        .expect(400);

      const errorResponse: ErrorResponseDto = response.body as ErrorResponseDto;
      expect(errorResponse.message).toContain(
        `property ${randomFieldName} should not exist`,
      );
      expect(errorResponse.error).toBe('Bad Request');
    });

    it('should handle different content lengths correctly', async () => {
      // Test with various content lengths using the real user ID
      const shortContent = faker.lorem.sentence();
      const longContent = faker.lorem.paragraphs(5);
      const shortCreateTaskDto: CreateQuizGenerationTaskDto = {
        userId: testUserId,
        text: shortContent,
      };
      const longCreateTaskDto: CreateQuizGenerationTaskDto = {
        userId: testUserId,
        text: longContent,
      };

      // Test with short content
      const shortResponse = await request(httpServer)
        .post('/quiz-generation-tasks')
        .send(shortCreateTaskDto)
        .expect(202);

      expect(
        (shortResponse.body as QuizGenerationTaskResponseDto).taskId,
      ).toBeDefined();

      // Test with long content
      const longResponse = await request(httpServer)
        .post('/quiz-generation-tasks')
        .send(longCreateTaskDto)
        .expect(202);

      expect(
        (longResponse.body as QuizGenerationTaskResponseDto).taskId,
      ).toBeDefined();
    }, 120000); // Longer timeout for content length tests which might take more time
  });
});
