import { faker } from "@faker-js/faker";
import { CreateUserUseCase } from "./create-user.use-case";
import { UserService } from "../interfaces/user-service.interface";
import { User } from "../entities/user";
import { UserAlreadyExistsError } from "../errors/user-errors";

describe("CreateUserUseCase", () => {
  let createUserUseCase: CreateUserUseCase;
  let userService: jest.Mocked<UserService>;

  beforeEach(() => {
    userService = {
      createUser: jest
        .fn()
        .mockImplementation(
          async (user: User) => await new Promise(() => user),
        ),
      getUserByEmail: jest
        .fn()
        .mockImplementation(async () => new Promise(() => null)),
    };
    createUserUseCase = new CreateUserUseCase(userService);
  });

  it("should create a new user successfully", async () => {
    // Arrange
    const email = faker.internet.email();
    const mockUser = new User({ email });

    userService.getUserByEmail.mockResolvedValue(null);
    userService.createUser.mockResolvedValue(mockUser);

    // Act
    const result = await createUserUseCase.execute({ email });

    // Assert
    expect(userService.getUserByEmail).toHaveBeenCalledWith(email);
    expect(userService.createUser).toHaveBeenCalled();
    expect(result).toEqual({ user: mockUser });
  });

  it("should throw UserAlreadyExistsError when user with email already exists", async () => {
    // Arrange
    const email = faker.internet.email();
    const existingUser = new User({ email });

    userService.getUserByEmail.mockResolvedValue(existingUser);

    // Act & Assert
    await expect(createUserUseCase.execute({ email })).rejects.toThrow(
      UserAlreadyExistsError,
    );
    await expect(createUserUseCase.execute({ email })).rejects.toThrow(
      `User with email '${email}' already exists`,
    );
    expect(userService.getUserByEmail).toHaveBeenCalledWith(email);
    expect(userService.createUser).not.toHaveBeenCalled();
  });
});
