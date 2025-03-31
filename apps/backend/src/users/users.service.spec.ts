import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserRepositoryImpl } from '../repositories/users/user.repository';
import { SubscriptionRepositoryImpl } from '../repositories/subscriptions/subscription.repository';
import { StripeService } from '../subscriptions/stripe.service';
import { CreateUserUseCase } from '@eclairum/core/use-cases';
import { CreateUserDto } from './dto/create-user.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import {
  User,
  Subscription,
  SubscriptionStatus,
} from '@eclairum/core/entities';

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

  // Define properties expected by Subscription.reconstitute
  interface SubscriptionReconstituteProps {
    id: string;
    userId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    stripePriceId: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

  // Helper to create mock domain Subscription using reconstitute
  const createMockCoreSubscription = (
    override: Partial<SubscriptionReconstituteProps> = {},
  ): Subscription => {
    const defaultProps: SubscriptionReconstituteProps = {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
      stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
      stripePriceId: `price_${faker.string.alphanumeric(14)}`,
      status: faker.helpers.objectValue(SubscriptionStatus),
      currentPeriodStart: faker.date.past(),
      currentPeriodEnd: faker.date.future(),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...override, // Apply overrides here
    };
    // Use reconstitute with the defined properties
    return Subscription.reconstitute(defaultProps);
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

  describe('getStripeCustomerId', () => {
    it('should return stripeCustomerId if user and subscription are found', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const mockUser = createMockCoreUser({ id: userId });
      const expectedStripeCustomerId = `cus_${faker.string.alphanumeric(14)}`;
      const mockSubscription = createMockCoreSubscription({
        userId: userId,
        stripeCustomerId: expectedStripeCustomerId,
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockSubscriptionRepository.findByUserId.mockResolvedValue(
        mockSubscription,
      );

      // Act
      const result = await service.getStripeCustomerId(userId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockSubscriptionRepository.findByUserId).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual({ stripeCustomerId: expectedStripeCustomerId });
    });

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      const userId = faker.string.uuid();
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getStripeCustomerId(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getStripeCustomerId(userId)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );
      expect(mockSubscriptionRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if subscription is not found', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const mockUser = createMockCoreUser({ id: userId });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockSubscriptionRepository.findByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getStripeCustomerId(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getStripeCustomerId(userId)).rejects.toThrow(
        `No subscription found for user ${userId}`,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });
  });

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
