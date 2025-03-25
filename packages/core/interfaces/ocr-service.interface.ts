/**
 * Provider key for OCR service dependency injection
 */
export const OCR_SERVICE_PROVIDER_KEY = "OCRService";

/**
 * Interface for services that extract text from uploaded files using OCR
 */
export interface OCRService {
  /**
   * Extracts text from a file associated with the given taskId
   * @param taskId The ID of the quiz generation task associated with the uploaded file
   * @returns A promise that resolves to the extracted text
   * @throws Error if text extraction fails
   */
  extractTextFromFile(taskId: string): Promise<string>;
}
