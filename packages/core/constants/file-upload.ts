/**
 * Maximum allowed file size for uploads (10MB)
 * 
 * This limit is appropriate for PDFs containing around 50,000 characters with formatting:
 * - Plain text would only be ~50-200KB
 * - PDFs with formatting, fonts, and small images typically range from 500KB to 5MB
 * - 10MB allows for rich documents while preventing excessively large files
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
