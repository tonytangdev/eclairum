import { faker } from "@faker-js/faker";
import { CreateUserUseCase } from "./create-user.use-case";
import { UserRepository } from "../interfaces/user-repository.interface";
import { User } from "../entities/user";
import { UserAlreadyExistsError } from "../errors/user-errors";

describe("CreateUserUseCase", () => {
  let createUserUseCase: CreateUserUseCase;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = {
      save: jest
        .fn()
        .mockImplementation(
          async (user: User) => await new Promise(() => user),
        ),
      findByEmail: jest
        .fn()
        .mockImplementation(async () => new Promise(() => null)),
    };
    createUserUseCase = new CreateUserUseCase(userRepository);
  });

  it("should create a new user successfully", async () => {
    // Arrange
    const email = faker.internet.email();
    const mockUser = new User({ email });

    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.save.mockResolvedValue(mockUser);

    // Act
    const result = await createUserUseCase.execute({ email });

    // Assert
    expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(userRepository.save).toHaveBeenCalled();
    expect(result).toEqual({ user: mockUser });
  });

  it("should throw UserAlreadyExistsError when user with email already exists", async () => {
    // Arrange
    const email = faker.internet.email();
    const existingUser = new User({ email });

    userRepository.findByEmail.mockResolvedValue(existingUser);

    // Act & Assert
    await expect(createUserUseCase.execute({ email })).rejects.toThrow(
      UserAlreadyExistsError,
    );
    await expect(createUserUseCase.execute({ email })).rejects.toThrow(
      `User with email '${email}' already exists`,
    );
    expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
