/**
 * Interface for services that extract text from uploaded files using OCR
 */
export interface OCRService {
  /**
   * Extracts text from a file associated with the given taskId
   * @param filePath The path to the file from which to extract text
   * @returns A promise that resolves to the extracted text
   * @throws Error if text extraction fails
   */
  extractTextFromFile(filePath: string): Promise<string>;
}
