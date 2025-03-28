import { faker } from "@faker-js/faker";
import { FetchOngoingQuizGenerationTasksUseCase } from "./fetch-ongoing-quiz-generation-tasks.use-case";
import { QuizGenerationTaskRepository } from "../interfaces/quiz-generation-task-repository.interface";
import { UserRepository } from "../interfaces/user-repository.interface";
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from "../entities/quiz-generation-task";
import { User } from "../entities/user";
import { UserNotFoundError } from "../errors/quiz-errors";

describe("FetchOngoingQuizGenerationTasksUseCase", () => {
  let useCase: FetchOngoingQuizGenerationTasksUseCase;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockQuizGenerationTaskRepository: jest.Mocked<QuizGenerationTaskRepository>;

  const userId = faker.string.uuid();
  const mockUser = { getId: () => userId } as User;
  const mockPendingTask = {
    getStatus: () => QuizGenerationStatus.PENDING,
  } as jest.Mocked<QuizGenerationTask>;
  const mockInProgressTask = {
    getStatus: () => QuizGenerationStatus.IN_PROGRESS,
  } as jest.Mocked<QuizGenerationTask>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup repository mocks
    mockUserRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    mockQuizGenerationTaskRepository = {
      findByUserIdAndStatuses: jest.fn(),
    } as unknown as jest.Mocked<QuizGenerationTaskRepository>;

    // Create the use case with mocked repositories
    useCase = new FetchOngoingQuizGenerationTasksUseCase(
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
      mockQuizGenerationTaskRepository.findByUserIdAndStatuses,
    ).not.toHaveBeenCalled();
  });

  it("should return empty array if no ongoing tasks exist for the user", async () => {
    // Arrange
    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserIdAndStatuses.mockResolvedValue(
      [],
    );

    // Act
    const result = await useCase.execute({ userId });

    // Assert
    expect(result).toEqual({ tasks: [] });
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(
      mockQuizGenerationTaskRepository.findByUserIdAndStatuses,
    ).toHaveBeenCalledWith(userId, [
      QuizGenerationStatus.PENDING,
      QuizGenerationStatus.IN_PROGRESS,
    ]);
  });

  it("should return ongoing tasks for a given user", async () => {
    // Arrange
    const ongoingTasks = [mockPendingTask, mockInProgressTask];

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserIdAndStatuses.mockResolvedValue(
      ongoingTasks,
    );

    // Act
    const result = await useCase.execute({ userId });

    // Assert
    expect(result).toEqual({ tasks: ongoingTasks });
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(
      mockQuizGenerationTaskRepository.findByUserIdAndStatuses,
    ).toHaveBeenCalledWith(userId, [
      QuizGenerationStatus.PENDING,
      QuizGenerationStatus.IN_PROGRESS,
    ]);
  });

  it("should include correct error message when user is not found", async () => {
    // Arrange
    mockUserRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute({ userId })).rejects.toThrow(
      `User with id ${userId} not found`,
    );
  });
});
