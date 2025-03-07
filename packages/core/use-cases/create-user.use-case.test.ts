import { faker } from "@faker-js/faker";
import { CreateUserUseCase } from "./create-user.use-case";
import { UserService } from "../interfaces/user-service.interface";
import { User } from "../entities/user";
import { UserAlreadyExistsError } from "../errors/user-errors";

describe("CreateUserUseCase", () => {
  let createUserUseCase: CreateUserUseCase;
  let userService: UserService;

  beforeEach(() => {
    userService = {
      createUser: jest.fn(),
      getUserByEmail: jest.fn(),
    };
    createUserUseCase = new CreateUserUseCase(userService);
  });

  it("should create a new user successfully", async () => {
    // Arrange
    const email = faker.internet.email();
    const mockUser = new User({ email });
    const getUserByEmailSpy = jest
      .spyOn(userService, "getUserByEmail")
      .mockResolvedValue(null);
    const createUserSpy = jest
      .spyOn(userService, "createUser")
      .mockResolvedValue(mockUser);

    // Act
    const result = await createUserUseCase.execute({ email });

    // Assert
    expect(getUserByEmailSpy).toHaveBeenCalledWith(email);
    expect(createUserSpy).toHaveBeenCalled();
    expect(result).toEqual({ user: mockUser });
  });

  it("should throw UserAlreadyExistsError when user with email already exists", async () => {
    // Arrange
    const email = faker.internet.email();
    const existingUser = new User({ email });
    const getUserByEmailSpy = jest
      .spyOn(userService, "getUserByEmail")
      .mockResolvedValue(existingUser);
    const createUserSpy = jest.spyOn(userService, "createUser");

    // Act & Assert
    await expect(createUserUseCase.execute({ email })).rejects.toThrow(
      UserAlreadyExistsError,
    );
    await expect(createUserUseCase.execute({ email })).rejects.toThrow(
      `User with email '${email}' already exists`,
    );
    expect(getUserByEmailSpy).toHaveBeenCalledWith(email);
    expect(createUserSpy).not.toHaveBeenCalled();
  });
});
