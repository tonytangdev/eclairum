import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { RelationalUserRepository } from './infrastructure/relational/user.repository';
import { CreateUserUseCase } from '@flash-me/core/use-cases';
import { CreateUserDto } from './dto/create-user.dto';
import { faker } from '@faker-js/faker';

// Mock the CreateUserUseCase class
jest.mock('@flash-me/core/use-cases', () => {
  return {
    CreateUserUseCase: jest.fn().mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue({}),
    })),
  };
});

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: jest.Mocked<RelationalUserRepository>;

  beforeEach(async () => {
    // Create a mock for the RelationalUserRepository
    mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<RelationalUserRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: RelationalUserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a CreateUserUseCase with the repository', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: faker.internet.email(),
      };

      // Act
      await service.createUser(createUserDto);

      // Assert
      expect(CreateUserUseCase).toHaveBeenCalledWith(mockUserRepository);
    });

    it('should call execute on the use case with the DTO', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: faker.internet.email(),
      };
      const mockExecute = jest.fn().mockResolvedValue({});
      (CreateUserUseCase as jest.Mock).mockImplementation(() => ({
        execute: mockExecute,
      }));

      // Act
      await service.createUser(createUserDto);

      // Assert
      expect(mockExecute).toHaveBeenCalledWith(createUserDto);
    });

    it('should return the result from the use case', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: faker.internet.email(),
      };
      const expectedResult = {
        id: faker.string.uuid(),
        email: createUserDto.email,
      };

      const mockExecute = jest.fn().mockResolvedValue(expectedResult);
      (CreateUserUseCase as jest.Mock).mockImplementation(() => ({
        execute: mockExecute,
      }));

      // Act
      const result = await service.createUser(createUserDto);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should handle optional id in DTO', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: faker.internet.email(),
        id: faker.string.uuid(),
      };
      const expectedResult = {
        id: createUserDto.id,
        email: createUserDto.email,
      };

      const mockExecute = jest.fn().mockResolvedValue(expectedResult);
      (CreateUserUseCase as jest.Mock).mockImplementation(() => ({
        execute: mockExecute,
      }));

      // Act
      const result = await service.createUser(createUserDto);

      // Assert
      expect(mockExecute).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
