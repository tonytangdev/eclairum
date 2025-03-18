import { faker } from "@faker-js/faker";
import { FetchQuizGenerationTasksForUserUseCase } from "./fetch-quiz-generation-tasks-for-user.use-case";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import { QuizGenerationTask } from "../entities/quiz-generation-task";
import { User } from "../entities/user";
import { UserNotFoundError } from "../errors/quiz-errors";

describe("FetchQuizGenerationTasksForUserUseCase", () => {
  let useCase: FetchQuizGenerationTasksForUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockQuizGenerationTaskRepository: jest.Mocked<QuizGenerationTaskRepository>;

  const userId = faker.string.uuid();
  const mockUser = { getId: () => userId } as User;
  const mockTasks = [
    {} as QuizGenerationTask,
    {} as QuizGenerationTask,
    {} as QuizGenerationTask,
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup repository mocks
    mockUserRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    mockQuizGenerationTaskRepository = {
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTaskRepository>;

    // Create the use case with mocked repositories
    useCase = new FetchQuizGenerationTasksForUserUseCase(
      mockUserRepository,
      mockQuizGenerationTaskRepository,
    );
  });

  it("should throw error if user does not exist", async () => {
    // Arrange
    mockUserRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute({ userId })).rejects.toThrow(
      UserNotFoundError,
    );
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(
      mockQuizGenerationTaskRepository.findByUserId,
    ).not.toHaveBeenCalled();
  });

  it("should return empty array if no tasks exist for the user", async () => {
    // Arrange
    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserId.mockResolvedValue([]);

    // Act
    const result = await useCase.execute({ userId });

    // Assert
    expect(result).toEqual({ tasks: [] });
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockQuizGenerationTaskRepository.findByUserId).toHaveBeenCalledWith(
      userId,
    );
  });

  it("should return tasks for a given user", async () => {
    // Arrange
    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserId.mockResolvedValue(mockTasks);

    // Act
    const result = await useCase.execute({ userId });

    // Assert
    expect(result).toEqual({ tasks: mockTasks });
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockQuizGenerationTaskRepository.findByUserId).toHaveBeenCalledWith(
      userId,
    );
  });
});
