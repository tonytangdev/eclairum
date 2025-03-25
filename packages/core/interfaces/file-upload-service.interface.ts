/**
 * Interface for services that handle file uploads
 */
export interface FileUploadService {
  /**
   * Generates a URL that can be used to upload a file
   * @param taskId - The ID of the task associated with the file upload
   * @returns A pre-signed URL for uploading a file
   */
  generateUploadUrl(taskId: string): Promise<string>;
}
