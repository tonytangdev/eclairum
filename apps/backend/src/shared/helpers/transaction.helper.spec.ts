import { Test } from '@nestjs/testing';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { TransactionHelper } from './transaction.helper';
import { faker } from '@faker-js/faker';

describe('TransactionHelper', () => {
  let transactionHelper: TransactionHelper;
  let mockDataSource: Partial<DataSource>;
  let mockQueryRunner: Partial<QueryRunner>;
  let mockEntityManager: Partial<EntityManager>;

  beforeEach(async () => {
    mockEntityManager = {};

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: mockEntityManager as EntityManager,
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionHelper,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    transactionHelper = moduleRef.get<TransactionHelper>(TransactionHelper);
  });

  describe('executeInTransaction', () => {
    it('should execute callback and commit transaction on success', async () => {
      // Arrange
      const expectedResult = {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        success: true,
      };
      const callback = jest.fn().mockResolvedValue(expectedResult);

      // Act
      const result = await transactionHelper.executeInTransaction(callback);

      // Assert
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(mockEntityManager);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });

    it('should rollback transaction and rethrow error on failure', async () => {
      // Arrange
      const expectedError = new Error(faker.lorem.sentence());
      const callback = jest.fn().mockRejectedValue(expectedError);

      // Act & Assert
      await expect(
        transactionHelper.executeInTransaction(callback),
      ).rejects.toThrow(expectedError);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(mockEntityManager);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should always release the query runner even on error during commit', async () => {
      // Arrange
      const expectedResult = {
        data: faker.lorem.paragraph(),
        timestamp: faker.date.recent(),
      };
      const callback = jest.fn().mockResolvedValue(expectedResult);
      mockQueryRunner.commitTransaction = jest
        .fn()
        .mockRejectedValue(
          new Error(`Commit failed: ${faker.lorem.sentence()}`),
        );

      // Act & Assert
      await expect(
        transactionHelper.executeInTransaction(callback),
      ).rejects.toThrow('Commit failed:');

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
