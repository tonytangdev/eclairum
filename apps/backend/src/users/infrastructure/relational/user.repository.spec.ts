import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RelationalUserRepository } from './user.repository';
import { UserEntity } from './entities/user.entity';
import { UserMapper } from './mappers/user.mapper';
import { User } from '@flash-me/core/entities';
import { faker } from '@faker-js/faker';

// Mock the UserMapper
jest.mock('./mappers/user.mapper', () => ({
  UserMapper: {
    toDomain: jest.fn(),
    toPersistence: jest.fn(),
  },
}));

describe('RelationalUserRepository', () => {
  let repository: RelationalUserRepository;
  let typeOrmRepository: jest.Mocked<Repository<UserEntity>>;

  beforeEach(async () => {
    // Create mock for TypeORM repository
    const mockTypeOrmRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelationalUserRepository,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<RelationalUserRepository>(RelationalUserRepository);
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
      expect(result).toBeNull();
      expect(UserMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should return mapped user when found', async () => {
      // Arrange
      const email = faker.internet.email().toLowerCase();
      const userEntity = new UserEntity();
      userEntity.id = faker.string.uuid();
      userEntity.email = email;
      userEntity.createdAt = new Date();
      userEntity.updatedAt = new Date();

      const domainUser = new User({
        id: userEntity.id,
        email: userEntity.email,
        createdAt: userEntity.createdAt,
        updatedAt: userEntity.updatedAt,
      });

      typeOrmRepository.findOne.mockResolvedValue(userEntity);
      (UserMapper.toDomain as jest.Mock).mockReturnValue(domainUser);

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(UserMapper.toDomain).toHaveBeenCalledWith(userEntity);
      expect(result).toBe(domainUser);
    });
  });

  describe('save', () => {
    it('should save the user and return the mapped result', async () => {
      // Arrange
      const domainUser = new User({
        id: faker.string.uuid(),
        email: faker.internet.email().toLowerCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const userEntity = new UserEntity();
      userEntity.id = domainUser.getId();
      userEntity.email = domainUser.getEmail();
      userEntity.createdAt = domainUser.getCreatedAt();
      userEntity.updatedAt = domainUser.getUpdatedAt();

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

    it('should handle new user creation', async () => {
      // Arrange
      const domainUser = new User({
        email: faker.internet.email().toLowerCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const userEntity = new UserEntity();
      userEntity.email = domainUser.getEmail();
      userEntity.createdAt = domainUser.getCreatedAt();
      userEntity.updatedAt = domainUser.getUpdatedAt();

      const savedEntity = {
        ...userEntity,
        id: faker.string.uuid(),
      };

      const savedDomainUser = new User({
        id: savedEntity.id,
        email: savedEntity.email,
        createdAt: savedEntity.createdAt,
        updatedAt: savedEntity.updatedAt,
      });

      (UserMapper.toPersistence as jest.Mock).mockReturnValue(userEntity);
      typeOrmRepository.save.mockResolvedValue(savedEntity);
      (UserMapper.toDomain as jest.Mock).mockReturnValue(savedDomainUser);

      // Act
      const result = await repository.save(domainUser);

      // Assert
      expect(UserMapper.toPersistence).toHaveBeenCalledWith(domainUser);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(userEntity);
      expect(UserMapper.toDomain).toHaveBeenCalledWith(savedEntity);
      expect(result).toBe(savedDomainUser);
    });
  });
});
