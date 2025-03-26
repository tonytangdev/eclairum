/**
 * Interface for services that handle file uploads
 */
export interface FileUploadService {
  /**
   * Generates a pre-signed URL for file upload
   * @param taskId The ID of the task to associate with the upload
   * @returns A pre-signed URL that can be used to upload a file
   */
  generateUploadUrl(bucketName: string, filePath: string): Promise<string>;
}
