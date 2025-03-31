import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';
import { faker } from '@faker-js/faker';

// Define a simplified mock structure
interface StripeMock {
  customers: {
    search: jest.Mock;
    create: jest.Mock;
  };
  subscriptions: {
    retrieve: jest.Mock;
  };
}

// Define the shared mock instance globally within the test file scope
const sharedStripeMockInstance: StripeMock = {
  customers: {
    search: jest.fn(),
    create: jest.fn(),
  },
  subscriptions: {
    retrieve: jest.fn(),
  },
};

// Mock Stripe completely inside the jest.mock factory function
jest.mock('stripe', () => {
  // Define a simple error class inside the factory
  class StripeMockError extends Error {
    type: string;
    code?: string;

    constructor(params: { type: string; message: string; code?: string }) {
      super(params.message);
      this.type = params.type;
      this.code = params.code;
      this.name = 'StripeError';
    }
  }

  // Mock constructor - *use the globally defined shared instance*
  const mockStripeConstructor = jest.fn(() => sharedStripeMockInstance);

  // Add static properties
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  (mockStripeConstructor as any).errors = {
    StripeError: StripeMockError,
  };

  // Return an object mimicking ES Module structure
  return {
    __esModule: true, // Signal this is an ES Module
    default: mockStripeConstructor, // Make the mock constructor the default export
  };
});

describe('StripeService', () => {
  let service: StripeService;
  let configService: jest.Mocked<ConfigService>;
  // No need for stripeMockInstance variable here anymore

  // Mock configuration values
  const mockConfig = {
    STRIPE_SECRET_KEY: 'test_stripe_key',
  };

  beforeEach(async () => {
    // Reset the globally defined mock instance's methods
    sharedStripeMockInstance.customers.search.mockClear();
    sharedStripeMockInstance.customers.create.mockClear();
    sharedStripeMockInstance.subscriptions.retrieve.mockClear();

    jest.clearAllMocks(); // Clear constructor mock calls etc.

    // Setup spy on Logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'error').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(jest.fn());

    // Mock ConfigService (provide only needed methods/properties)
    const mockGet = jest.fn((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') {
        return mockConfig.STRIPE_SECRET_KEY;
      }
      return undefined;
    });
    configService = {
      get: mockGet,
      // Add other methods if StripeService constructor uses them, otherwise leave empty
    } as unknown as jest.Mocked<ConfigService>; // Cast necessary if methods missing

    // Setup module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: configService, // Provide the mock
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);

    // Remove the problematic assignment
    // stripeMockInstance = (Stripe as unknown as jest.Mock).mock.instances[0] as StripeMock;
  });

  describe('constructor', () => {
    it('should initialize with valid config', () => {
      expect(service).toBeDefined();
      // Check if the mock constructor was called
      expect(Stripe).toHaveBeenCalledWith('test_stripe_key', {
        apiVersion: '2025-02-24.acacia',
        typescript: true,
      });
    });

    it('should throw error if API key is not configured', () => {
      // Arrange: Reset the mock for 'get' specifically for this test
      // Use the reference `configService.get` which IS the jest.Mock
      (configService.get as jest.Mock).mockReturnValue(undefined);

      // Act & Assert: Re-instantiate the service with the modified mock
      expect(() => new StripeService(configService)).toThrow(
        'STRIPE_SECRET_KEY is not configured.',
      );
    });
  });

  describe('findOrCreateCustomer', () => {
    const userId = faker.string.uuid();
    const email = faker.internet.email();
    const name = faker.person.fullName();
    const customerId = `cus_${faker.string.alphanumeric(14)}`;

    const mockInput = {
      userId,
      email,
      name,
    };

    it('should return existing customer if found', async () => {
      // Arrange
      sharedStripeMockInstance.customers.search.mockResolvedValueOnce({
        data: [{ id: customerId }],
      });

      // Act
      const result = await service.findOrCreateCustomer(mockInput);

      // Assert
      expect(sharedStripeMockInstance.customers.search).toHaveBeenCalledWith({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });
      expect(result).toEqual({ customerId });
      expect(sharedStripeMockInstance.customers.create).not.toHaveBeenCalled();
    });

    it('should create new customer if not found', async () => {
      // Arrange
      sharedStripeMockInstance.customers.search.mockResolvedValueOnce({
        data: [],
      });
      sharedStripeMockInstance.customers.create.mockResolvedValueOnce({
        id: customerId,
      });

      // Act
      const result = await service.findOrCreateCustomer(mockInput);

      // Assert
      expect(sharedStripeMockInstance.customers.search).toHaveBeenCalledWith({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });
      expect(sharedStripeMockInstance.customers.create).toHaveBeenCalledWith({
        email,
        name,
        metadata: { userId },
      });
      expect(result).toEqual({ customerId });
    });

    it('should throw InternalServerErrorException on Stripe error', async () => {
      // Arrange
      const stripeError = new Error('Stripe API error');
      sharedStripeMockInstance.customers.search.mockRejectedValueOnce(
        stripeError,
      );

      // Act & Assert
      await expect(service.findOrCreateCustomer(mockInput)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getSubscription', () => {
    const subscriptionId = `sub_${faker.string.alphanumeric(14)}`;
    const customerId = `cus_${faker.string.alphanumeric(14)}`;
    const priceId = `price_${faker.string.alphanumeric(14)}`;
    const timestamp = Math.floor(Date.now() / 1000);

    it('should retrieve and map subscription successfully', async () => {
      // Arrange
      sharedStripeMockInstance.subscriptions.retrieve.mockResolvedValueOnce({
        id: subscriptionId,
        status: 'active',
        current_period_start: timestamp - 86400, // 1 day ago
        current_period_end: timestamp + 86400, // 1 day in future
        cancel_at_period_end: false,
        customer: customerId,
        items: {
          data: [{ price: { id: priceId } }],
        },
      });

      // Act
      const result = await service.getSubscription(subscriptionId);

      // Assert
      expect(
        sharedStripeMockInstance.subscriptions.retrieve,
      ).toHaveBeenCalledWith(subscriptionId);
      expect(result).toEqual({
        subscriptionId,
        status: 'active',
        currentPeriodStart: expect.any(Date) as Date, // Cast expect.any
        currentPeriodEnd: expect.any(Date) as Date, // Cast expect.any
        priceId,
        cancelAtPeriodEnd: false,
        customerId,
      });
    });

    it('should handle customer as object instead of string', async () => {
      // Arrange
      sharedStripeMockInstance.subscriptions.retrieve.mockResolvedValueOnce({
        id: subscriptionId,
        status: 'active',
        current_period_start: timestamp - 86400,
        current_period_end: timestamp + 86400,
        cancel_at_period_end: false,
        customer: { id: customerId }, // Customer as object
        items: {
          data: [{ price: { id: priceId } }],
        },
      });

      // Act
      const result = await service.getSubscription(subscriptionId);

      // Assert
      expect(result.customerId).toEqual(customerId);
    });

    it('should throw NotFoundException when Stripe indicates resource_missing', async () => {
      // Arrange: Revert to using the mocked StripeError class for instanceof check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const mockStripeError = new (Stripe as any).errors.StripeError({
        type: 'invalid_request_error',
        message: 'No such subscription',
        code: 'resource_missing',
      });

      sharedStripeMockInstance.subscriptions.retrieve.mockRejectedValueOnce(
        mockStripeError,
      );

      // Act & Assert: Verify the service throws NotFoundException
      await expect(service.getSubscription(subscriptionId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException for other Stripe-like errors', async () => {
      // Arrange: Revert to using the mocked StripeError class for instanceof check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const mockStripeError = new (Stripe as any).errors.StripeError({
        type: 'api_error',
        message: 'Something went wrong',
        code: 'api_error',
      });

      sharedStripeMockInstance.subscriptions.retrieve.mockRejectedValueOnce(
        mockStripeError,
      );

      // Act & Assert: Verify the service wraps this in InternalServerErrorException
      await expect(service.getSubscription(subscriptionId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException on generic errors from retrieve', async () => {
      // Arrange: Keep using generic Error here - this test remains correct
      const genericError = new Error('Generic error');
      sharedStripeMockInstance.subscriptions.retrieve.mockRejectedValueOnce(
        genericError,
      );

      // Act & Assert: Verify the service wraps this in InternalServerErrorException
      await expect(service.getSubscription(subscriptionId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException on unexpected non-Error throwable', async () => {
      // Arrange: Reject with something that is not an instance of Error
      const unexpectedThrowable = { message: 'Something truly unexpected' };
      sharedStripeMockInstance.subscriptions.retrieve.mockRejectedValueOnce(
        unexpectedThrowable,
      );

      // Act & Assert: Verify the service throws the generic InternalServerErrorException
      await expect(service.getSubscription(subscriptionId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findCustomerByUserId', () => {
    const userId = faker.string.uuid();
    const customerId = `cus_${faker.string.alphanumeric(14)}`;

    it('should return customer ID if found', async () => {
      // Arrange
      sharedStripeMockInstance.customers.search.mockResolvedValueOnce({
        data: [{ id: customerId }],
      });

      // Act
      const result = await service.findCustomerByUserId(userId);

      // Assert
      expect(sharedStripeMockInstance.customers.search).toHaveBeenCalledWith({
        query: `metadata['userId']:'${userId}'`,
        limit: 1,
      });
      expect(result).toEqual({ customerId });
    });

    it('should return null if customer not found', async () => {
      // Arrange
      sharedStripeMockInstance.customers.search.mockResolvedValueOnce({
        data: [],
      });

      // Act
      const result = await service.findCustomerByUserId(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException on Stripe error', async () => {
      // Arrange
      const stripeError = new Error('Stripe API error');
      sharedStripeMockInstance.customers.search.mockRejectedValueOnce(
        stripeError,
      );

      // Act & Assert
      await expect(service.findCustomerByUserId(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
