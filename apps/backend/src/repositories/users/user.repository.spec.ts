import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepositoryImpl } from './user.repository';
import { UserMapper } from './mappers/user.mapper';
import { User } from '@eclairum/core/entities';
import { faker } from '@faker-js/faker';
import { UserEntity } from '../../common/entities/user.entity';

// Mock the UserMapper
jest.mock('./mappers/user.mapper', () => ({
  UserMapper: {
    toDomain: jest.fn(),
    toPersistence: jest.fn(),
  },
}));

describe('UserRepositoryImpl', () => {
  let repository: UserRepositoryImpl;
  let typeOrmRepository: jest.Mocked<Repository<UserEntity>>;

  // Test data
  const testId = faker.string.uuid();
  const testEmail = faker.internet.email().toLowerCase();

  // Create reusable entities for testing
  const createUserEntity = () => {
    const entity = new UserEntity();
    entity.id = testId;
    entity.email = testEmail;
    entity.createdAt = new Date();
    entity.updatedAt = new Date();
    return entity;
  };

  const createDomainUser = () => {
    return new User({
      id: testId,
      email: testEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  beforeEach(async () => {
    // Create mock for TypeORM repository
    const mockTypeOrmRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepositoryImpl,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<UserRepositoryImpl>(UserRepositoryImpl);
    typeOrmRepository = module.get(getRepositoryToken(UserEntity));

    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return null when user is not found', async () => {
      // Arrange
      const email = faker.internet.email().toLowerCase();
      typeOrmRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(typeOrmRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
      expect(UserMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should return mapped user when found', async () => {
      // Arrange
      const userEntity = createUserEntity();
      const domainUser = createDomainUser();

      typeOrmRepository.findOne.mockResolvedValue(userEntity);
      (UserMapper.toDomain as jest.Mock).mockReturnValue(domainUser);

      // Act
      const result = await repository.findByEmail(testEmail);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email: testEmail },
      });
      expect(typeOrmRepository.findOne).toHaveBeenCalledTimes(1);
      expect(UserMapper.toDomain).toHaveBeenCalledWith(userEntity);
      expect(UserMapper.toDomain).toHaveBeenCalledTimes(1);
      expect(result).toBe(domainUser);
      expect(result?.getId()).toBe(testId);
      expect(result?.getEmail()).toBe(testEmail);
    });
  });

  describe('findById', () => {
    it('should return null when user is not found by ID', async () => {
      // Arrange
      typeOrmRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById(testId);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: testId },
      });
      expect(typeOrmRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
      expect(UserMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should return mapped user when found by ID', async () => {
      // Arrange
      const userEntity = createUserEntity();
      const domainUser = createDomainUser();

      typeOrmRepository.findOne.mockResolvedValue(userEntity);
      (UserMapper.toDomain as jest.Mock).mockReturnValue(domainUser);

      // Act
      const result = await repository.findById(testId);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: testId },
      });
      expect(UserMapper.toDomain).toHaveBeenCalledWith(userEntity);
      expect(result).toBe(domainUser);
      expect(result?.getId()).toBe(testId);
    });
  });

  describe('save', () => {
    it('should save an existing user and return the mapped result', async () => {
      // Arrange
      const domainUser = createDomainUser();
      const userEntity = createUserEntity();
      const savedEntity = { ...userEntity };

      (UserMapper.toPersistence as jest.Mock).mockReturnValue(userEntity);
      typeOrmRepository.save.mockResolvedValue(savedEntity);
      (UserMapper.toDomain as jest.Mock).mockReturnValue(domainUser);

      // Act
      const result = await repository.save(domainUser);

      // Assert
      expect(UserMapper.toPersistence).toHaveBeenCalledWith(domainUser);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(userEntity);
      expect(UserMapper.toDomain).toHaveBeenCalledWith(savedEntity);
      expect(result).toBe(domainUser);
    });

    it('should handle new user creation with generated ID', async () => {
      // Arrange
      const newUserId = faker.string.uuid();
      const newEmail = faker.internet.email().toLowerCase();

      const newDomainUser = new User({
        email: newEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newUserEntity = new UserEntity();
      newUserEntity.email = newEmail;
      newUserEntity.createdAt = newDomainUser.getCreatedAt();
      newUserEntity.updatedAt = newDomainUser.getUpdatedAt();

      const savedEntity = {
        ...newUserEntity,
        id: newUserId,
      };

      const savedDomainUser = new User({
        id: newUserId,
        email: newEmail,
        createdAt: newDomainUser.getCreatedAt(),
        updatedAt: newDomainUser.getUpdatedAt(),
      });

      (UserMapper.toPersistence as jest.Mock).mockReturnValue(newUserEntity);
      typeOrmRepository.save.mockResolvedValue(savedEntity);
      (UserMapper.toDomain as jest.Mock).mockReturnValue(savedDomainUser);

      // Act
      const result = await repository.save(newDomainUser);

      // Assert
      expect(UserMapper.toPersistence).toHaveBeenCalledWith(newDomainUser);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(newUserEntity);
      expect(UserMapper.toDomain).toHaveBeenCalledWith(savedEntity);
      expect(result).toBe(savedDomainUser);
      expect(result.getId()).toBe(newUserId);
      expect(result.getEmail()).toBe(newEmail);
    });

    it('should propagate errors from the database', async () => {
      // Arrange
      const domainUser = createDomainUser();
      const userEntity = createUserEntity();
      const dbError = new Error('Database connection failed');

      (UserMapper.toPersistence as jest.Mock).mockReturnValue(userEntity);
      typeOrmRepository.save.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.save(domainUser)).rejects.toThrow(
        'Database connection failed',
      );
      expect(UserMapper.toPersistence).toHaveBeenCalledWith(domainUser);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(userEntity);
      expect(UserMapper.toDomain).not.toHaveBeenCalled();
    });
  });
});
