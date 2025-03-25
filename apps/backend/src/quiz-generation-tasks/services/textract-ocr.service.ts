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

@Injectable()
export class TextractOCRService implements OCRService {
  private readonly textractClient: TextractClient;
  private readonly logger = new Logger(TextractOCRService.name);
  private readonly pollIntervalMs = 5000;
  private readonly maxPollAttempts = 12; // 60 seconds at 5 second intervals
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
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

    this.textractClient = new TextractClient({
      region,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
    });
  }

  async extractTextFromFile(taskId: string): Promise<string> {
    try {
      this.logger.log(`Starting text extraction for task: ${taskId}`);
      const s3ObjectName = this.getS3ObjectNameFromTaskId(taskId);

      const jobId = await this.startTextDetection(s3ObjectName);
      this.logger.log(`Textract job started: ${jobId}`);

      const extractedText = await this.pollForTextDetectionCompletion(jobId);
      this.logger.log(`Text extraction completed for task: ${taskId}`);

      return extractedText;
    } catch (error) {
      this.logger.error(`Text extraction failed for task ${taskId}`, error);
      throw new Error(
        `Failed to extract text from file: ${(error as Error).message}`,
      );
    }
  }

  private getS3ObjectNameFromTaskId(taskId: string): string {
    return `uploads/${taskId}/document.pdf`;
  }

  private async startTextDetection(s3ObjectName: string): Promise<string> {
    const startCommand = new StartDocumentTextDetectionCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: this.bucketName,
          Name: s3ObjectName,
        },
      },
    });

    const { JobId } = await this.textractClient.send(startCommand);

    if (!JobId) {
      throw new Error('Failed to start text detection job');
    }

    return JobId;
  }

  private async pollForTextDetectionCompletion(jobId: string): Promise<string> {
    let pollAttempts = 0;

    while (pollAttempts < this.maxPollAttempts) {
      const getCommand = new GetDocumentTextDetectionCommand({ JobId: jobId });
      const { JobStatus, NextToken, Blocks } =
        await this.textractClient.send(getCommand);

      if (JobStatus === 'SUCCEEDED') {
        return await this.collectAllTextBlocks(jobId, NextToken, Blocks || []);
      } else if (JobStatus === 'FAILED') {
        throw new Error('Textract text detection job failed');
      }

      // Wait before polling again
      await this.delay(this.pollIntervalMs);
      pollAttempts++;
    }

    throw new Error('Text detection timed out');
  }

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

  private convertBlocksToText(blocks: Block[]): string {
    return blocks
      .filter((block) => block.BlockType === 'LINE')
      .map((block) => block.Text || '')
      .join('\n');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
