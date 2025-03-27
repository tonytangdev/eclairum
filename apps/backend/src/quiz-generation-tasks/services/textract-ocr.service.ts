import { Injectable, Logger } from '@nestjs/common';
import { OCRService } from '@eclairum/core/interfaces';
import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
  Block,
} from '@aws-sdk/client-textract';
import { ConfigService } from '@nestjs/config';

export const OCR_SERVICE_PROVIDER_KEY = 'OCR_SERVICE_PROVIDER_KEY';

/**
 * Configuration options for TextractOCRService
 */
export interface TextractOCRServiceOptions {
  /** Interval in milliseconds between polling attempts (default: 10000) */
  pollIntervalMs?: number;
  /** Maximum number of polling attempts before timeout (default: 20) */
  maxPollAttempts?: number;
}

/**
 * OCR service implementation using AWS Textract
 * Extracts text from files stored in S3 using AWS Textract
 */
@Injectable()
export class TextractOCRService implements OCRService {
  private readonly textractClient: TextractClient;
  private readonly logger = new Logger(TextractOCRService.name);
  private readonly pollIntervalMs: number;
  private readonly maxPollAttempts: number;
  private readonly bucketName: string;

  constructor(
    private readonly configService: ConfigService,
    options?: TextractOCRServiceOptions,
  ) {
    const region = this.configService.get<string>('AWS_REGION') || 'eu-west-3';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    this.bucketName = this.configService.get<string>(
      'AWS_S3_BUCKET_NAME',
    ) as string;

    if (!this.bucketName) {
      throw new Error('AWS_S3_BUCKET environment variable is required');
    }

    this.pollIntervalMs = options?.pollIntervalMs ?? 10000; // 10 seconds by default
    this.maxPollAttempts = options?.maxPollAttempts ?? 20; // 20 attempts by default

    this.textractClient = new TextractClient({
      region,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
    });
  }

  /**
   * Extracts text from a file associated with the given task ID
   * @param filePath The path to the file from which to extract text
   * @returns The extracted text from the file
   * @throws Error if no file is found or text extraction fails
   */
  async extractTextFromFile(filePath: string): Promise<string> {
    try {
      const jobId = await this.startTextDetection(filePath);

      const extractedText = await this.pollForTextDetectionCompletion(jobId);

      return extractedText;
    } catch (error) {
      this.logger.error(
        `Text extraction failed for task ${filePath}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new Error(
        `Failed to extract text from file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Starts a text detection job in AWS Textract
   * @param s3ObjectPath The path of the file in S3
   * @returns The ID of the Textract job
   */
  private async startTextDetection(s3ObjectPath: string): Promise<string> {
    const startCommand = new StartDocumentTextDetectionCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: this.bucketName,
          Name: s3ObjectPath,
        },
      },
    });

    const { JobId } = await this.textractClient.send(startCommand);

    if (!JobId) {
      throw new Error('Failed to start text detection job');
    }

    return JobId;
  }

  /**
   * Polls for the completion of a text detection job
   * @param jobId The ID of the Textract job
   * @returns The extracted text
   */
  private async pollForTextDetectionCompletion(jobId: string): Promise<string> {
    let pollAttempts = 0;

    while (pollAttempts < this.maxPollAttempts) {
      console.log(
        `Polling for job status: ${jobId} (attempt ${pollAttempts + 1})`,
      );
      const getCommand = new GetDocumentTextDetectionCommand({ JobId: jobId });
      const { JobStatus, NextToken, Blocks } =
        await this.textractClient.send(getCommand);

      if (JobStatus === 'SUCCEEDED') {
        return await this.collectAllTextBlocks(jobId, NextToken, Blocks || []);
      } else if (JobStatus === 'FAILED') {
        throw new Error('Textract text detection job failed');
      }

      // Wait before polling again
      console.log({ pollIntervalMs: this.pollIntervalMs });
      await this.delay(this.pollIntervalMs);
      console.log(
        `Waiting for ${this.pollIntervalMs}ms before next poll attempt...`,
      );
      pollAttempts++;
    }

    throw new Error('Text detection timed out');
  }

  /**
   * Collects all text blocks from a completed Textract job
   * @param jobId The ID of the Textract job
   * @param nextToken Token for pagination
   * @param initialBlocks Initial set of blocks
   * @returns The combined extracted text
   */
  private async collectAllTextBlocks(
    jobId: string,
    nextToken: string | undefined,
    initialBlocks: Block[],
  ): Promise<string> {
    const allBlocks = [...initialBlocks];
    let currentToken = nextToken;

    while (currentToken) {
      const nextGetCommand = new GetDocumentTextDetectionCommand({
        JobId: jobId,
        NextToken: currentToken,
      });

      const { Blocks: newBlocks, NextToken: newNextToken } =
        await this.textractClient.send(nextGetCommand);
      allBlocks.push(...(newBlocks || []));
      currentToken = newNextToken;
    }

    return this.convertBlocksToText(allBlocks);
  }

  /**
   * Converts Textract blocks to plain text
   * @param blocks Textract blocks
   * @returns Plain text
   */
  private convertBlocksToText(blocks: Block[]): string {
    return blocks
      .filter((block) => block.BlockType === 'LINE')
      .map((block) => block.Text || '')
      .join('\n');
  }

  /**
   * Utility function to create a delay
   * @param ms Milliseconds to delay
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
