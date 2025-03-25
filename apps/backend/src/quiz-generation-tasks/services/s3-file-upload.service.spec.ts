import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3FileUploadService } from './s3-file-upload.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { faker } from '@faker-js/faker';
import { Logger } from '@nestjs/common';

// Mock external dependencies
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('S3FileUploadService', () => {
  let service: S3FileUploadService;
  let configService: ConfigService;

  // Mock configuration values
  const mockConfig = {
    AWS_S3_BUCKET_NAME: 'test-bucket',
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  };

  // Mock task ID and expected URL
  const mockTaskId = faker.string.uuid();
  const mockSignedUrl = 'https://test-bucket.s3.amazonaws.com/test-file.pdf';

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup spy on Logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'error').mockImplementation(jest.fn());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3FileUploadService,
        {
          provide: ConfigService,
          useValue: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            getOrThrow: jest.fn((key: string) => mockConfig[key]),
          },
        },
      ],
    }).compile();

    service = module.get<S3FileUploadService>(S3FileUploadService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with the correct configuration', () => {
      // Assert
      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'AWS_S3_BUCKET_NAME',
      );
      expect(configService.getOrThrow).toHaveBeenCalledWith('AWS_REGION');
      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'AWS_ACCESS_KEY_ID',
      );
      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'AWS_SECRET_ACCESS_KEY',
      );
      expect(S3Client).toHaveBeenCalledWith({
        region: mockConfig.AWS_REGION,
        credentials: {
          accessKeyId: mockConfig.AWS_ACCESS_KEY_ID,
          secretAccessKey: mockConfig.AWS_SECRET_ACCESS_KEY,
        },
      });
    });
  });

  describe('generateUploadUrl', () => {
    it('should generate a pre-signed URL successfully', async () => {
      // Arrange
      (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

      // Act
      const result = await service.generateUploadUrl(mockTaskId);

      // Assert
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: mockConfig.AWS_S3_BUCKET_NAME,
        Key: `uploads/${mockTaskId}/document.pdf`,
        ContentType: 'application/pdf',
      });
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(PutObjectCommand),
        { expiresIn: 1800 },
      );
      expect(result).toBe(mockSignedUrl);
    });

    it('should log appropriate messages when generating URL', async () => {
      // Arrange
      (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

      // Act
      await service.generateUploadUrl(mockTaskId);

      // Assert
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        `Generating pre-signed URL for task ${mockTaskId}`,
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        `Generated pre-signed URL for task ${mockTaskId}`,
      );
    });

    it('should throw and log an error when URL generation fails', async () => {
      // Arrange
      const mockError = new Error('S3 error');
      (getSignedUrl as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.generateUploadUrl(mockTaskId)).rejects.toThrow(
        `Failed to generate upload URL: ${mockError.message}`,
      );

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Failed to generate pre-signed URL for task ${mockTaskId}`,
        mockError,
      );
    });
  });
});
