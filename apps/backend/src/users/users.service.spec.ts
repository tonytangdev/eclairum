import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserRepositoryImpl } from '../repositories/users/user.repository';
import { SubscriptionRepositoryImpl } from '../repositories/subscriptions/subscription.repository';
import { StripeService } from '../subscriptions/stripe.service';
import { CreateUserUseCase } from '@eclairum/core/use-cases';
import { CreateUserDto } from './dto/create-user.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { User } from '@eclairum/core/entities';

// Define a type for the mocked module if needed, or use Record<string, unknown>
const mockCreateUserUseCaseExecute = jest.fn<any, any>();

jest.mock('@eclairum/core/use-cases', () => {
  const originalModule = jest.requireActual<{ [key: string]: unknown }>(
    '@eclairum/core/use-cases',
  );
  return {
    __esModule: true,
    ...originalModule,
    CreateUserUseCase: jest.fn().mockImplementation(() => ({
      execute: mockCreateUserUseCaseExecute, // Use the specific mock function
    })),
  };
});

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: jest.Mocked<UserRepositoryImpl>;
  let mockSubscriptionRepository: jest.Mocked<SubscriptionRepositoryImpl>;
  let mockStripeService: jest.Mocked<StripeService>;
  const MockedCreateUserUseCaseExecute = mockCreateUserUseCaseExecute;
  const MockedCreateUserUseCase = CreateUserUseCase as jest.MockedClass<
    typeof CreateUserUseCase
  >;

  type UserConstructorArgs = ConstructorParameters<typeof User>[0];

  const createMockCoreUser = (
    override: Partial<UserConstructorArgs> = {},
  ): User => {
    const defaultProps: UserConstructorArgs = {
      email: faker.internet.email(),
      ...override,
    };
    const user = new User(defaultProps);
    return user;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    MockedCreateUserUseCaseExecute.mockClear();

    // Manually create mocks with unknown cast
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserRepositoryImpl>;

    mockSubscriptionRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findByStripeSubscriptionId: jest.fn(),
    } as unknown as jest.Mocked<SubscriptionRepositoryImpl>;

    mockStripeService = {
      findOrCreateCustomer: jest.fn(),
      getSubscription: jest.fn(),
      findCustomerByUserId: jest.fn(),
    } as unknown as jest.Mocked<StripeService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepositoryImpl, useValue: mockUserRepository },
        {
          provide: SubscriptionRepositoryImpl,
          useValue: mockSubscriptionRepository,
        },
        { provide: StripeService, useValue: mockStripeService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('createUser', () => {
    it('should create and save a user using the use case', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: faker.internet.email(),
      };
      const mockCreatedUser = createMockCoreUser({
        email: createUserDto.email,
      });
      const expectedResponse = { user: mockCreatedUser };

      // Configure the shared execute mock function for this test
      MockedCreateUserUseCaseExecute.mockResolvedValue(expectedResponse);

      // Act
      const result = await service.createUser(createUserDto);

      // Assert
      // Check that the constructor was called (by the service method)
      expect(MockedCreateUserUseCase).toHaveBeenCalledWith(mockUserRepository);
      // Check that the execute method (mocked at the top) was called
      expect(MockedCreateUserUseCaseExecute).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should handle optional id in DTO (pass it to use case)', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const createUserDto: CreateUserDto = {
        id: userId,
        email: faker.internet.email(),
      };
      const mockCreatedUser = createMockCoreUser({
        id: userId,
        email: createUserDto.email,
      });
      const expectedResponse = { user: mockCreatedUser };

      MockedCreateUserUseCaseExecute.mockResolvedValue(expectedResponse);

      // Act
      const result = await service.createUser(createUserDto);

      // Assert
      expect(MockedCreateUserUseCase).toHaveBeenCalledWith(mockUserRepository);
      expect(MockedCreateUserUseCaseExecute).toHaveBeenCalledWith({
        id: userId,
        email: createUserDto.email,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors from the use case', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: faker.internet.email(),
      };
      const error = new BadRequestException('User already exists');

      MockedCreateUserUseCaseExecute.mockRejectedValue(error);

      // Act & Assert
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createUser(createUserDto)).rejects.toThrow(
        'User already exists',
      );
      expect(MockedCreateUserUseCase).toHaveBeenCalledWith(mockUserRepository);
      expect(MockedCreateUserUseCaseExecute).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
    });
  });

  // describe('getStripeCustomerId') // Add tests if needed

  describe('createStripeCustomer', () => {
    it('should find user and call stripeService.findOrCreateCustomer', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const userEmail = faker.internet.email();
      const mockUser = new User({ id: userId, email: userEmail });
      const expectedStripeCustomerId = `cus_${faker.string.alphanumeric(14)}`;
      const getIdSpy = jest.spyOn(mockUser, 'getId');
      const getEmailSpy = jest.spyOn(mockUser, 'getEmail');

      // Setup mock return values
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockStripeService.findOrCreateCustomer.mockResolvedValue({
        customerId: expectedStripeCustomerId,
      });

      // Act
      const result = await service.createStripeCustomer(userId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(getIdSpy).toHaveBeenCalled();
      expect(getEmailSpy).toHaveBeenCalled();
      expect(mockStripeService.findOrCreateCustomer).toHaveBeenCalledWith({
        userId: userId,
        email: userEmail.toLowerCase(),
      });
      expect(result).toEqual({ stripeCustomerId: expectedStripeCustomerId });
      getIdSpy.mockRestore();
      getEmailSpy.mockRestore();
    });

    it('should throw NotFoundException if user not found', async () => {
      // Arrange
      const userId = faker.string.uuid();
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createStripeCustomer(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createStripeCustomer(userId)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );
      expect(mockStripeService.findOrCreateCustomer).not.toHaveBeenCalled();
    });

    it('should propagate errors from stripeService.findOrCreateCustomer', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const mockUser = new User({ id: userId, email: faker.internet.email() });
      const stripeError = new Error('Stripe API error');
      const getIdSpy = jest.spyOn(mockUser, 'getId');
      const getEmailSpy = jest.spyOn(mockUser, 'getEmail');

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockStripeService.findOrCreateCustomer.mockRejectedValue(stripeError);

      // Act & Assert
      await expect(service.createStripeCustomer(userId)).rejects.toThrow(
        stripeError,
      );
      expect(getIdSpy).toHaveBeenCalled();
      expect(getEmailSpy).toHaveBeenCalled();
      getIdSpy.mockRestore();
      getEmailSpy.mockRestore();
    });
  });
});
