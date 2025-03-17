import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { UserAlreadyExistsError } from '@eclairum/core/errors';
import { DomainExceptionsFilter } from './domain-exceptions.filter';
import { faker } from '@faker-js/faker';

describe('DomainExceptionsFilter', () => {
  let filter: DomainExceptionsFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockSwitchToHttp: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new DomainExceptionsFilter();

    // Create mock response functions
    mockJson = jest.fn().mockReturnValue({});
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    mockSwitchToHttp = jest
      .fn()
      .mockReturnValue({ getResponse: mockGetResponse });

    // Create mock ArgumentsHost
    mockHost = {
      switchToHttp: mockSwitchToHttp,
    } as unknown as ArgumentsHost;
  });

  describe('catch', () => {
    it('should handle UserAlreadyExistsError with HTTP 409 Conflict', () => {
      // Arrange
      const email = faker.internet.email();
      const errorMessage = `User with email '${email}' already exists`;
      const exception = new UserAlreadyExistsError(email);

      // Act
      filter.catch(exception, mockHost);

      // Assert
      expect(mockSwitchToHttp).toHaveBeenCalled();
      expect(mockGetResponse).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: HttpStatus.CONFLICT,
        message: errorMessage,
        error: 'Conflict',
      });
    });

    it('should handle generic Error with HTTP 400 Bad Request', () => {
      // Arrange
      const errorMessage = 'Some other domain error';
      const exception = new Error(errorMessage);

      // Act
      filter.catch(exception, mockHost);

      // Assert
      expect(mockSwitchToHttp).toHaveBeenCalled();
      expect(mockGetResponse).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: errorMessage,
        error: 'Bad Request',
      });
    });

    it('should handle non-Error objects with default message', () => {
      // Arrange
      const exception = { someProperty: 'not an error' };

      // Act
      filter.catch(exception, mockHost);

      // Assert
      expect(mockSwitchToHttp).toHaveBeenCalled();
      expect(mockGetResponse).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad Request',
        error: 'Bad Request',
      });
    });

    it('should properly extract and use custom error message', () => {
      // Arrange
      class CustomDomainError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomDomainError';
        }
      }

      const errorMessage = 'Custom domain-specific error message';
      const exception = new CustomDomainError(errorMessage);

      // Act
      filter.catch(exception, mockHost);

      // Assert
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: errorMessage,
        }),
      );
    });
  });
});
