import { faker } from "@faker-js/faker";
import { CreateUserUseCase } from "./create-user.use-case";
import { UserRepository } from "../interfaces/user-repository.interface";
import { User } from "../entities/user";
import { UserAlreadyExistsError } from "../errors/user-errors";

describe("CreateUserUseCase", () => {
  let createUserUseCase: CreateUserUseCase;
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };
    createUserUseCase = new CreateUserUseCase(userRepository);
  });

  it("should create a new user successfully", async () => {
    // Arrange
    const email = faker.internet.email();
    const mockUser = new User({ email });
    const findByEmailSpy = jest
      .spyOn(userRepository, "findByEmail")
      .mockResolvedValue(null);
    const createSpy = jest
      .spyOn(userRepository, "create")
      .mockResolvedValue(mockUser);

    // Act
    const result = await createUserUseCase.execute({ email });

    // Assert
    expect(findByEmailSpy).toHaveBeenCalledWith(email);
    expect(createSpy).toHaveBeenCalled();
    expect(result).toEqual({ user: mockUser });
  });

  it("should throw UserAlreadyExistsError when user with email already exists", async () => {
    // Arrange
    const email = faker.internet.email();
    const existingUser = new User({ email });
    const findByEmailSpy = jest
      .spyOn(userRepository, "findByEmail")
      .mockResolvedValue(existingUser);
    const createSpy = jest.spyOn(userRepository, "create");

    // Act & Assert
    await expect(createUserUseCase.execute({ email })).rejects.toThrow(
      UserAlreadyExistsError,
    );
    await expect(createUserUseCase.execute({ email })).rejects.toThrow(
      `User with email '${email}' already exists`,
    );
    expect(findByEmailSpy).toHaveBeenCalledWith(email);
    expect(createSpy).not.toHaveBeenCalled();
  });
});
