import { Injectable, Logger } from '@nestjs/common';
import { FileUploadService } from '@eclairum/core/interfaces';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const FILE_UPLOAD_SERVICE_PROVIDER_KEY = 'FILE_UPLOAD_SERVICE';

@Injectable()
export class S3FileUploadService implements FileUploadService {
  private readonly logger = new Logger(S3FileUploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  // Default to 30 minutes
  private readonly urlExpirationSeconds: number = 1800;

  constructor(private readonly configService: ConfigService) {
    this.bucketName =
      this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME');

    const region = this.configService.getOrThrow<string>('AWS_REGION');
    const accessKeyId =
      this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.getOrThrow<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Generates a pre-signed URL for file upload
   * @param taskId The ID of the quiz generation task
   * @returns A pre-signed URL for uploading the file
   */
  async generateUploadUrl(taskId: string): Promise<string> {
    this.logger.log(`Generating pre-signed URL for task ${taskId}`);

    const key = `uploads/${taskId}/document.pdf`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: 'application/pdf',
    });

    try {
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.urlExpirationSeconds,
      });

      this.logger.log(`Generated pre-signed URL for task ${taskId}`);
      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate pre-signed URL for task ${taskId}`,
        error,
      );
      throw new Error(
        `Failed to generate upload URL: ${(error as Error).message}`,
      );
    }
  }
}
