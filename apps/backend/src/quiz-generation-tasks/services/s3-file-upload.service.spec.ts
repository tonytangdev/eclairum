import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3FileUploadService } from './s3-file-upload.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
  let configService: jest.Mocked<ConfigService>;
  let mockS3Client: jest.Mocked<S3Client>;

  // Mock configuration values
  const mockConfig = {
    AWS_S3_BUCKET_NAME: 'test-bucket',
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  };

  // Test data
  const bucketName = 'test-bucket';
  const filePath = 'uploads/test-file.pdf';
  const mockSignedUrl = 'https://test-bucket.s3.amazonaws.com/test-file.pdf';

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup spy on Logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'error').mockImplementation(jest.fn());

    // Mock ConfigService
    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        if (Object.prototype.hasOwnProperty.call(mockConfig, key)) {
          return mockConfig[key as keyof typeof mockConfig];
        }
        throw new Error(`Config key "${key}" not found`);
      }),
    };

    // Mock S3Client
    mockS3Client = {
      send: jest.fn(),
    } as unknown as jest.Mocked<S3Client>;

    // Setup module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3FileUploadService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3FileUploadService>(S3FileUploadService);
    configService = module.get(ConfigService);

    // Mock the S3Client constructor to return our mockS3Client
    (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(
      () => mockS3Client as unknown as S3Client,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with the correct AWS configuration', () => {
      // Assert that config values were retrieved correctly
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

      // Assert that S3Client was constructed with correct config
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
      const result = await service.generateUploadUrl(bucketName, filePath);

      // Assert
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: bucketName,
        Key: filePath,
        ContentType: 'application/pdf',
      });

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(PutObjectCommand),
        { expiresIn: expect.any(Number) as number },
      );

      expect(result).toBe(mockSignedUrl);
    });

    it('should determine correct content type based on file extension', async () => {
      // Arrange
      const testCases = [
        { path: 'file.pdf', expectedType: 'application/pdf' },
        { path: 'file.doc', expectedType: 'application/msword' },
        {
          path: 'file.docx',
          expectedType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        { path: 'file.txt', expectedType: 'text/plain' },
        { path: 'file.jpg', expectedType: 'image/jpeg' },
        { path: 'file.jpeg', expectedType: 'image/jpeg' },
        { path: 'file.png', expectedType: 'image/png' },
        { path: 'file.gif', expectedType: 'image/gif' },
        { path: 'file.unknown', expectedType: 'application/octet-stream' },
        { path: 'file', expectedType: 'application/octet-stream' },
      ];

      (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

      // Test each file extension
      for (const testCase of testCases) {
        // Act
        await service.generateUploadUrl(bucketName, testCase.path);

        // Assert last call to PutObjectCommand had correct ContentType
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const lastCallArgs = (
          PutObjectCommand as unknown as jest.Mock
        ).mock.calls.at(-1);
        const lastCallOptions = lastCallArgs[0] as {
          Bucket: string;
          Key: string;
          ContentType: string;
        };

        expect(lastCallOptions.ContentType).toBe(testCase.expectedType);
      }
    });

    it('should log appropriate messages when generating URL', async () => {
      // Arrange
      (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      await service.generateUploadUrl(bucketName, filePath);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        `Generating pre-signed URL for file ${filePath}`,
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Generated pre-signed URL for file ${filePath}`,
      );
    });

    it('should throw and log an error when URL generation fails', async () => {
      // Arrange
      const mockError = new Error('S3 error');
      (getSignedUrl as jest.Mock).mockRejectedValue(mockError);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      // Act & Assert
      await expect(
        service.generateUploadUrl(bucketName, filePath),
      ).rejects.toThrow(`Failed to generate upload URL: ${mockError.message}`);

      expect(errorSpy).toHaveBeenCalledWith(
        `Failed to generate pre-signed URL for file ${filePath}`,
        mockError,
      );
    });
  });
});
