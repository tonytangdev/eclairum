import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return status ok and a valid timestamp', () => {
      // Arrange
      jest.useFakeTimers();
      const now = new Date();
      jest.setSystemTime(now);

      // Act
      const result = appController.healthCheck();

      // Assert
      expect(result).toEqual({
        status: 'ok',
        timestamp: now.toISOString(),
      });

      // Cleanup
      jest.useRealTimers();
    });
  });
});
