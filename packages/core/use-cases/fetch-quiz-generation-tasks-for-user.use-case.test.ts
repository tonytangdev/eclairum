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
      findByUserIdPaginated: jest.fn(),
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
      mockQuizGenerationTaskRepository.findByUserIdPaginated,
    ).not.toHaveBeenCalled();
  });

  it("should return empty array if no tasks exist for the user", async () => {
    // Arrange
    const defaultPagination = { page: 1, limit: 10 };
    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserIdPaginated.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, totalItems: 0, totalPages: 0 },
    });

    // Act
    const result = await useCase.execute({ userId });

    // Assert
    expect(result).toEqual({
      tasks: [],
      pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 },
    });
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(
      mockQuizGenerationTaskRepository.findByUserIdPaginated,
    ).toHaveBeenCalledWith(userId, defaultPagination);
  });

  it("should return tasks for a given user", async () => {
    // Arrange
    const defaultPagination = { page: 1, limit: 10 };
    const paginationMeta = {
      page: 1,
      limit: 10,
      totalItems: mockTasks.length,
      totalPages: 1,
    };

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserIdPaginated.mockResolvedValue({
      data: mockTasks,
      meta: paginationMeta,
    });

    // Act
    const result = await useCase.execute({ userId });

    // Assert
    expect(result).toEqual({
      tasks: mockTasks,
      pagination: paginationMeta,
    });
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(
      mockQuizGenerationTaskRepository.findByUserIdPaginated,
    ).toHaveBeenCalledWith(userId, defaultPagination);
  });

  it("should return paginated tasks for a given user", async () => {
    // Arrange
    const paginationParams = { page: 2, limit: 10 };
    const paginationMeta = {
      page: 2,
      limit: 10,
      totalItems: 25,
      totalPages: 3,
    };

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserIdPaginated.mockResolvedValue({
      data: mockTasks,
      meta: paginationMeta,
    });

    // Act
    const result = await useCase.execute({
      userId,
      pagination: paginationParams,
    });

    // Assert
    expect(result).toEqual({
      tasks: mockTasks,
      pagination: paginationMeta,
    });
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(
      mockQuizGenerationTaskRepository.findByUserIdPaginated,
    ).toHaveBeenCalledWith(userId, paginationParams);
  });

  it("should use default pagination parameters when not provided", async () => {
    // Arrange
    const defaultPagination = { page: 1, limit: 10 };
    const paginationMeta = {
      page: 1,
      limit: 10,
      totalItems: 25,
      totalPages: 3,
    };

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserIdPaginated.mockResolvedValue({
      data: mockTasks,
      meta: paginationMeta,
    });

    // Act
    const result = await useCase.execute({ userId });

    // Assert
    expect(
      mockQuizGenerationTaskRepository.findByUserIdPaginated,
    ).toHaveBeenCalledWith(userId, defaultPagination);
    expect(result.pagination).toEqual(paginationMeta);
  });

  it("should normalize negative page numbers to 1", async () => {
    // Arrange
    const paginationParams = { page: -5, limit: 10 };
    const normalizedParams = { page: 1, limit: 10 };
    const paginationMeta = {
      page: 1,
      limit: 10,
      totalItems: 25,
      totalPages: 3,
    };

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserIdPaginated.mockResolvedValue({
      data: mockTasks,
      meta: paginationMeta,
    });

    // Act
    const result = await useCase.execute({
      userId,
      pagination: paginationParams,
    });

    // Assert
    expect(result.tasks).toEqual(mockTasks);
    expect(
      mockQuizGenerationTaskRepository.findByUserIdPaginated,
    ).toHaveBeenCalledWith(userId, normalizedParams);
  });

  it("should normalize zero page number to 1", async () => {
    // Arrange
    const paginationParams = { page: 0, limit: 10 };
    const normalizedParams = { page: 1, limit: 10 };

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserIdPaginated.mockResolvedValue({
      data: mockTasks,
      meta: { page: 1, limit: 10, totalItems: 25, totalPages: 3 },
    });

    // Act
    await useCase.execute({
      userId,
      pagination: paginationParams,
    });

    // Assert
    expect(
      mockQuizGenerationTaskRepository.findByUserIdPaginated,
    ).toHaveBeenCalledWith(userId, normalizedParams);
  });

  it("should normalize negative limit to 1", async () => {
    // Arrange
    const paginationParams = { page: 1, limit: -10 };
    const normalizedParams = { page: 1, limit: 1 };

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserIdPaginated.mockResolvedValue({
      data: mockTasks,
      meta: { page: 1, limit: 1, totalItems: 25, totalPages: 25 },
    });

    // Act
    await useCase.execute({
      userId,
      pagination: paginationParams,
    });

    // Assert
    expect(
      mockQuizGenerationTaskRepository.findByUserIdPaginated,
    ).toHaveBeenCalledWith(userId, normalizedParams);
  });

  it("should cap limit to maximum of 100", async () => {
    // Arrange
    const paginationParams = { page: 1, limit: 500 };
    const normalizedParams = { page: 1, limit: 100 };

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserIdPaginated.mockResolvedValue({
      data: mockTasks,
      meta: { page: 1, limit: 100, totalItems: 25, totalPages: 1 },
    });

    // Act
    await useCase.execute({
      userId,
      pagination: paginationParams,
    });

    // Assert
    expect(
      mockQuizGenerationTaskRepository.findByUserIdPaginated,
    ).toHaveBeenCalledWith(userId, normalizedParams);
  });

  it("should include correct error message when user is not found", async () => {
    // Arrange
    mockUserRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute({ userId })).rejects.toThrow(
      `User with id ${userId} not found`,
    );
  });

  it("should handle edge case with exactly one page of results", async () => {
    // Arrange
    const paginationMeta = {
      page: 1,
      limit: 10,
      totalItems: 10,
      totalPages: 1,
    };

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserIdPaginated.mockResolvedValue({
      data: mockTasks,
      meta: paginationMeta,
    });

    // Act
    const result = await useCase.execute({ userId });

    // Assert
    expect(result.pagination).toEqual(paginationMeta);
    expect(result.pagination?.totalPages).toBe(1);
  });

  it("should handle edge case with empty result set", async () => {
    // Arrange
    const paginationMeta = {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
    };

    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockQuizGenerationTaskRepository.findByUserIdPaginated.mockResolvedValue({
      data: [],
      meta: paginationMeta,
    });

    // Act
    const result = await useCase.execute({ userId });

    // Assert
    expect(result.tasks).toEqual([]);
    expect(result.pagination).toEqual(paginationMeta);
  });
});
