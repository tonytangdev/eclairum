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
});
