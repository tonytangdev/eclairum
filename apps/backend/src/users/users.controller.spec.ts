import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { faker } from '@faker-js/faker';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    createUser: jest.fn(),
    getStripeCustomerId: jest.fn(),
    createStripeCustomer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should call usersService.createUser with the correct parameters', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: faker.internet.email(),
      };
      const expectedResult = {
        id: faker.string.uuid(),
        email: createUserDto.email,
      };
      mockUsersService.createUser.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.createUser(createUserDto);

      // Assert
      expect(service.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });

    it('should return what the service returns', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: faker.internet.email(),
        id: faker.string.uuid(), // Testing with optional id provided
      };
      const expectedUser = {
        id: createUserDto.id,
        email: createUserDto.email,
      };
      mockUsersService.createUser.mockResolvedValue(expectedUser);

      // Act
      const result = await controller.createUser(createUserDto);

      // Assert
      expect(result).toEqual(expectedUser);
    });
  });

  describe('getStripeCustomerId', () => {
    it('should call usersService.getStripeCustomerId with the correct userId', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const expectedCustomerId = `cus_${faker.string.alphanumeric(14)}`;
      mockUsersService.getStripeCustomerId.mockResolvedValue({
        stripeCustomerId: expectedCustomerId,
      });

      // Act
      const result = await controller.getStripeCustomerId(userId);

      // Assert
      expect(service.getStripeCustomerId).toHaveBeenCalledWith(userId);
      expect(service.getStripeCustomerId).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ stripeCustomerId: expectedCustomerId });
    });

    it('should return the customer ID object provided by the service', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const customerId = `cus_${faker.string.alphanumeric(14)}`;
      mockUsersService.getStripeCustomerId.mockResolvedValue({
        stripeCustomerId: customerId,
      });

      // Act
      const result = await controller.getStripeCustomerId(userId);

      // Assert
      expect(result).toEqual({ stripeCustomerId: customerId });
    });
  });

  describe('createStripeCustomer', () => {
    it('should call usersService.createStripeCustomer with the correct userId', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const expectedCustomer = {
        id: `cus_${faker.string.alphanumeric(14)}`,
        // Add other relevant customer properties if the service returns them
      };
      mockUsersService.createStripeCustomer.mockResolvedValue(expectedCustomer);

      // Act
      const result = await controller.createStripeCustomer(userId);

      // Assert
      expect(service.createStripeCustomer).toHaveBeenCalledWith(userId);
      expect(service.createStripeCustomer).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedCustomer);
    });

    it('should return the customer object provided by the service', async () => {
      // Arrange
      const userId = faker.string.uuid();
      const customer = { id: `cus_${faker.string.alphanumeric(14)}` };
      mockUsersService.createStripeCustomer.mockResolvedValue(customer);

      // Act
      const result = await controller.createStripeCustomer(userId);

      // Assert
      expect(result).toEqual(customer);
    });
  });
});
