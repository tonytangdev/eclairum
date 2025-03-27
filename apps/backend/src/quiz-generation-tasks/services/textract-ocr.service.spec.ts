/* eslint-disable @typescript-eslint/no-misused-promises */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { TextractOCRService } from './textract-ocr.service';
import { TextractClient } from '@aws-sdk/client-textract';
import { faker } from '@faker-js/faker';

// Mock AWS SDK
jest.mock('@aws-sdk/client-textract');

describe('TextractOCRService', () => {
  let service: TextractOCRService;
  let configService: jest.Mocked<ConfigService>;
  let mockTextractClient: jest.Mocked<TextractClient>;

  const mockConfig = {
    AWS_REGION: 'eu-west-3',
    AWS_ACCESS_KEY_ID: faker.string.alphanumeric(20),
    AWS_SECRET_ACCESS_KEY: faker.string.alphanumeric(40),
    AWS_S3_BUCKET_NAME: 'test-bucket',
  };

  const mockJobId = faker.string.uuid();
  const mockFilePath = 'documents/test-file.pdf';

  // Use much faster polling for tests to speed up test execution
  const testPollIntervalMs = 1; // Use 1ms instead of 100ms
  const testMaxPollAttempts = 2; // Use 2 attempts instead of 5

  beforeEach(async () => {
    // Arrange
    jest.clearAllMocks();

    // Setup spies on Logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'error').mockImplementation(jest.fn());

    // Mock ConfigService
    configService = {
      get: jest.fn((key: string) => {
        if (Object.prototype.hasOwnProperty.call(mockConfig, key)) {
          return mockConfig[key as keyof typeof mockConfig];
        }
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    // Mock TextractClient
    mockTextractClient = {
      send: jest.fn(),
    } as unknown as jest.Mocked<TextractClient>;
    (
      TextractClient as jest.MockedClass<typeof TextractClient>
    ).mockImplementation(() => mockTextractClient as unknown as TextractClient);

    // Setup module with very fast polling configuration
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TextractOCRService,
          useFactory: () =>
            new TextractOCRService(configService, {
              pollIntervalMs: testPollIntervalMs,
              maxPollAttempts: testMaxPollAttempts,
            }),
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<TextractOCRService>(TextractOCRService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with the correct AWS configuration', () => {
      // Assert
      expect(configService.get).toHaveBeenCalledWith('AWS_REGION');
      expect(configService.get).toHaveBeenCalledWith('AWS_ACCESS_KEY_ID');
      expect(configService.get).toHaveBeenCalledWith('AWS_SECRET_ACCESS_KEY');
      expect(configService.get).toHaveBeenCalledWith('AWS_S3_BUCKET_NAME');

      expect(TextractClient).toHaveBeenCalledWith({
        region: mockConfig.AWS_REGION,
        credentials: {
          accessKeyId: mockConfig.AWS_ACCESS_KEY_ID,
          secretAccessKey: mockConfig.AWS_SECRET_ACCESS_KEY,
        },
      });
    });

    it('should use default region if not provided', async () => {
      // Arrange
      jest.clearAllMocks();

      const configWithoutRegion = { ...mockConfig };
      // @ts-expect-error Remove AWS_REGION from config
      delete configWithoutRegion.AWS_REGION;

      const configServiceWithoutRegion = {
        get: jest.fn((key: string) => {
          if (key === 'AWS_REGION') return undefined;
          if (Object.prototype.hasOwnProperty.call(mockConfig, key)) {
            return mockConfig[key as keyof typeof mockConfig];
          }
          return undefined;
        }),
      } as unknown as jest.Mocked<ConfigService>;

      // Act
      const module = await Test.createTestingModule({
        providers: [
          {
            provide: TextractOCRService,
            useFactory: () =>
              new TextractOCRService(configServiceWithoutRegion, {}),
          },
          {
            provide: ConfigService,
            useValue: configServiceWithoutRegion,
          },
        ],
      }).compile();

      // We need to create the service to trigger the constructor
      module.get<TextractOCRService>(TextractOCRService);

      // Assert
      expect(TextractClient).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'eu-west-3', // Default region
        }),
      );
    });

    it('should throw error if bucket name is not provided', async () => {
      // Arrange
      jest.clearAllMocks();

      const configServiceWithoutBucket = {
        get: jest.fn((key: string) => {
          if (key === 'AWS_S3_BUCKET_NAME') return undefined;
          if (Object.prototype.hasOwnProperty.call(mockConfig, key)) {
            return mockConfig[key as keyof typeof mockConfig];
          }
          return undefined;
        }),
      } as unknown as jest.Mocked<ConfigService>;

      // Act & Assert
      const moduleFactory = Test.createTestingModule({
        providers: [
          {
            provide: TextractOCRService,
            useFactory: () =>
              new TextractOCRService(configServiceWithoutBucket, {}),
          },
          {
            provide: ConfigService,
            useValue: configServiceWithoutBucket,
          },
        ],
      });

      await expect(moduleFactory.compile()).rejects.toThrow(
        'AWS_S3_BUCKET environment variable is required',
      );
    });
  });

  describe('extractTextFromFile', () => {
    it('should successfully extract text from a file', async () => {
      // Arrange
      // First call: Start text detection (returns job ID)
      mockTextractClient.send.mockImplementationOnce(() =>
        Promise.resolve({ JobId: mockJobId }),
      );

      // Second call: Check job status (returns SUCCEEDED with text blocks)
      mockTextractClient.send.mockImplementationOnce(() =>
        Promise.resolve({
          JobStatus: 'SUCCEEDED',
          Blocks: [
            { BlockType: 'LINE', Text: 'Line 1' },
            { BlockType: 'LINE', Text: 'Line 2' },
            { BlockType: 'OTHER', Text: 'Should be ignored' },
            { BlockType: 'LINE', Text: 'Line 3' },
          ],
        }),
      );

      // Act
      const extractedText = await service.extractTextFromFile(mockFilePath);

      // Assert
      expect(extractedText).toBe('Line 1\nLine 2\nLine 3');

      // Verify correct command was sent for text detection
      expect(mockTextractClient.send).toHaveBeenCalled();
    });

    it('should handle pagination when extracting text', async () => {
      // Arrange
      const firstBlock = { BlockType: 'LINE', Text: 'Page 1 - Line 1' };
      const secondBlock = { BlockType: 'LINE', Text: 'Page 2 - Line 1' };

      // First call: Start text detection
      mockTextractClient.send.mockImplementationOnce(() =>
        Promise.resolve({ JobId: mockJobId }),
      );

      // Second call: Check status, return first page with NextToken
      mockTextractClient.send.mockImplementationOnce(() =>
        Promise.resolve({
          JobStatus: 'SUCCEEDED',
          Blocks: [firstBlock],
          NextToken: 'nextpage',
        }),
      );

      // Third call: Get more results using NextToken
      mockTextractClient.send.mockImplementationOnce(() =>
        Promise.resolve({
          Blocks: [secondBlock],
          NextToken: undefined,
        }),
      );

      // Act
      const extractedText = await service.extractTextFromFile(mockFilePath);

      // Assert
      expect(extractedText).toBe('Page 1 - Line 1\nPage 2 - Line 1');
      expect(mockTextractClient.send).toHaveBeenCalledTimes(3);
    });

    it('should throw error when text detection job fails', async () => {
      // Arrange
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      // First call: Start text detection
      mockTextractClient.send.mockImplementationOnce(() =>
        Promise.resolve({ JobId: mockJobId }),
      );

      // Second call: Check status, return FAILED
      mockTextractClient.send.mockImplementationOnce(() =>
        Promise.resolve({ JobStatus: 'FAILED' }),
      );

      // Act & Assert
      await expect(service.extractTextFromFile(mockFilePath)).rejects.toThrow(
        'Failed to extract text from file: Textract text detection job failed',
      );

      expect(errorSpy).toHaveBeenCalledWith(
        `Text extraction failed for task ${mockFilePath}`,
        expect.any(String),
      );
    });

    it('should throw error when job ID is not returned', async () => {
      // Arrange
      mockTextractClient.send.mockImplementationOnce(
        () => Promise.resolve({}), // No JobId returned
      );

      // Act & Assert
      await expect(service.extractTextFromFile(mockFilePath)).rejects.toThrow(
        'Failed to extract text from file: Failed to start text detection job',
      );
    });

    it('should throw error when text detection times out', async () => {
      // Arrange

      // First call: Start text detection
      mockTextractClient.send.mockImplementationOnce(() =>
        Promise.resolve({ JobId: mockJobId }),
      );

      // All subsequent calls: Return IN_PROGRESS status
      mockTextractClient.send.mockImplementation(() =>
        Promise.resolve({ JobStatus: 'IN_PROGRESS' }),
      );

      // Act
      const extractionPromise = service.extractTextFromFile(mockFilePath);

      // Assert
      await expect(extractionPromise).rejects.toThrow(
        'Failed to extract text from file: Text detection timed out',
      );

      // Verify the correct number of polling attempts
      expect(mockTextractClient.send).toHaveBeenCalledTimes(
        testMaxPollAttempts + 1,
      ); // +1 for initial call
    });

    it('should handle AWS SDK errors gracefully', async () => {
      // Arrange
      const awsError = new Error('AWS client error');
      // @ts-expect-error aws error
      mockTextractClient.send.mockRejectedValueOnce(awsError);

      // Act & Assert
      await expect(service.extractTextFromFile(mockFilePath)).rejects.toThrow(
        'Failed to extract text from file: AWS client error',
      );
    });

    it('should filter non-LINE block types when converting results', async () => {
      // Arrange
      // First call: Start text detection
      mockTextractClient.send.mockImplementationOnce(() =>
        Promise.resolve({ JobId: mockJobId }),
      );

      // Second call: Check status with mixed block types
      mockTextractClient.send.mockImplementationOnce(() =>
        Promise.resolve({
          JobStatus: 'SUCCEEDED',
          Blocks: [
            { BlockType: 'PAGE', Text: 'Should not appear' },
            { BlockType: 'LINE', Text: 'First line' },
            { BlockType: 'WORD', Text: 'Should not appear' },
            { BlockType: 'LINE', Text: 'Second line' },
            { BlockType: 'TABLE', Text: 'Should not appear' },
          ],
        }),
      );

      // Act
      const extractedText = await service.extractTextFromFile(mockFilePath);

      // Assert
      expect(extractedText).toBe('First line\nSecond line');
    });
  });
});
