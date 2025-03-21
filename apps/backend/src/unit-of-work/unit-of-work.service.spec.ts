import { Test, TestingModule } from '@nestjs/testing';
import { UnitOfWorkService } from './unit-of-work.service';
import { DataSource, EntityManager } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Scope } from '@nestjs/common';

describe('UnitOfWorkService', () => {
  let moduleRef: TestingModule;
  let service: UnitOfWorkService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockDefaultManager: jest.Mocked<EntityManager>;
  let mockTransactionManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    // Setup mock transaction manager
    mockTransactionManager = {
      query: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    // Setup mock default manager
    mockDefaultManager = {
      query: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    // Setup mock DataSource with transaction method that matches TypeORM's signature
    mockDataSource = {
      manager: mockDefaultManager,
      transaction: jest.fn().mockImplementation(function (
        runInTransactionOrIsolationLevel: unknown,
        maybeRunInTransaction?: unknown,
      ) {
        // If two parameters are provided, the second one is the callback
        // If only one parameter is provided, it is the callback
        const callback =
          typeof maybeRunInTransaction === 'function'
            ? (maybeRunInTransaction as (
                manager: EntityManager,
              ) => Promise<unknown>)
            : typeof runInTransactionOrIsolationLevel === 'function'
              ? (runInTransactionOrIsolationLevel as (
                  manager: EntityManager,
                ) => Promise<unknown>)
              : undefined;

        if (!callback) {
          throw new Error('No valid callback provided to transaction');
        }

        return Promise.resolve(callback(mockTransactionManager));
      }),
    } as unknown as jest.Mocked<DataSource>;

    // Create module with options to override scope
    moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: UnitOfWorkService,
          useClass: UnitOfWorkService,
          scope: Scope.DEFAULT, // Override the REQUEST scope for testing
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    // Use resolve instead of get for scoped providers
    service = moduleRef.get<UnitOfWorkService>(UnitOfWorkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with the default manager from DataSource', () => {
      // Assert
      expect(service.getManager()).toBe(mockDefaultManager);
    });
  });

  describe('getManager', () => {
    it('should return the current manager', () => {
      // Act
      const result = service.getManager();

      // Assert
      expect(result).toBe(mockDefaultManager);
    });
  });

  describe('doTransactional', () => {
    it('should execute function inside a transaction and return its result', async () => {
      // Arrange
      const expectedResult = { success: true };
      const transactionFn = jest.fn().mockResolvedValue(expectedResult);

      // Act
      const result = await service.doTransactional(transactionFn);

      // Assert
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(transactionFn).toHaveBeenCalledWith(mockTransactionManager);
      expect(result).toEqual(expectedResult);
      expect(service.getManager()).toBe(mockDefaultManager); // Manager is reset
    });

    it('should set the transaction manager during transaction and reset afterward', async () => {
      // Arrange
      let managerDuringTransaction: EntityManager | null = null;

      const transactionFn = jest
        .fn()
        .mockImplementation((entityManager: EntityManager) => {
          managerDuringTransaction = entityManager;
          return Promise.resolve('result');
        });

      // Act
      await service.doTransactional(transactionFn);

      // Assert
      expect(managerDuringTransaction).toBe(mockTransactionManager);
      expect(service.getManager()).toBe(mockDefaultManager); // Manager is reset
    });

    it('should reuse existing transaction when already in one', async () => {
      // Arrange - Start a transaction
      const innerTransactionFn = jest.fn().mockResolvedValue('inner result');

      const outerTransactionFn = jest.fn().mockImplementation(() => {
        // Call doTransactional again from inside a transaction
        return service.doTransactional(innerTransactionFn);
      });

      // Act
      await service.doTransactional(outerTransactionFn);

      // Assert
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1); // Only one real transaction
    });

    it('should reset manager and flags when transaction throws error', async () => {
      // Arrange
      const error = new Error('Transaction error');
      const transactionFn = jest.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(service.doTransactional(transactionFn)).rejects.toThrow(
        error,
      );
      expect(service.getManager()).toBe(mockDefaultManager); // Manager is reset
    });

    it('should use the transaction manager while transaction is active', async () => {
      // Arrange
      let managerUsed: EntityManager | null = null;

      // Mock implementation to verify manager during execution
      mockDataSource.transaction.mockImplementationOnce(function (
        runInTransactionOrIsolationLevel: unknown,
        maybeRunInTransaction?: unknown,
      ) {
        // Use the same callback resolution logic as the main mock
        const callback =
          typeof maybeRunInTransaction === 'function'
            ? (maybeRunInTransaction as (
                manager: EntityManager,
              ) => Promise<unknown>)
            : typeof runInTransactionOrIsolationLevel === 'function'
              ? (runInTransactionOrIsolationLevel as (
                  manager: EntityManager,
                ) => Promise<unknown>)
              : undefined;

        if (!callback) {
          throw new Error('No valid callback provided to transaction');
        }

        return Promise.resolve().then(() => {
          const result = callback(mockTransactionManager);
          managerUsed = service.getManager(); // Capture the current manager during transaction
          return result;
        });
      });

      // Act
      await service.doTransactional(() => Promise.resolve('test'));

      // Assert
      expect(managerUsed).toBe(mockTransactionManager);
    });

    it('should handle nested transactional calls correctly', async () => {
      // Arrange
      const innerFn = () => Promise.resolve('inner result');

      const outerFn = jest.fn().mockImplementation(() => {
        // Start inner transaction
        return service.doTransactional(innerFn);
      });

      // Act
      const result = await service.doTransactional(outerFn);

      // Assert
      expect(result).toBe('inner result');
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1); // Only one actual transaction
    });

    it('should reset manager even when transaction function throws', async () => {
      // Arrange
      const error = new Error('Function error');
      let managerAfterError: EntityManager | null = null;

      mockDataSource.transaction.mockImplementationOnce(async function (
        runInTransactionOrIsolationLevel: unknown,
        maybeRunInTransaction?: unknown,
      ) {
        const callback =
          typeof maybeRunInTransaction === 'function'
            ? (maybeRunInTransaction as (
                manager: EntityManager,
              ) => Promise<unknown>)
            : typeof runInTransactionOrIsolationLevel === 'function'
              ? (runInTransactionOrIsolationLevel as (
                  manager: EntityManager,
                ) => Promise<unknown>)
              : undefined;

        if (!callback) {
          throw new Error('No valid callback provided to transaction');
        }

        try {
          return await callback(mockTransactionManager);
        } catch (e) {
          managerAfterError = service.getManager(); // Still should be transaction manager
          throw e;
        }
      });

      // Mock function that throws error
      const transactionFn = jest.fn().mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(service.doTransactional(transactionFn)).rejects.toThrow(
        error,
      );

      // During the transaction failure, we should still have the transaction manager
      expect(managerAfterError).toBe(mockTransactionManager);

      // After everything is done, we should have the default manager
      expect(service.getManager()).toBe(mockDefaultManager);
    });
  });
});
