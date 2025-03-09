import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { QuizGenerationTaskRepositoryImpl } from './quiz-generation-task.repository';
import { QuizGenerationTaskEntity } from '../entities/quiz-generation-task.entity';
import { QuizGenerationTaskMapper } from '../mappers/quiz-generation-task.mapper';
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from '@flash-me/core/entities';
import { faker } from '@faker-js/faker';

describe('QuizGenerationTaskRepositoryImpl', () => {
  let repository: QuizGenerationTaskRepositoryImpl;
  let typeOrmRepository: Repository<QuizGenerationTaskEntity>;
  let entityManager: EntityManager;

  // Mock task creation helper
  const createMockTask = () =>
    new QuizGenerationTask({
      id: faker.string.uuid(),
      textContent: faker.lorem.paragraphs(2),
      status: QuizGenerationStatus.PENDING,
      questions: [],
    });

  // Mock entity creation helper
  const createMockEntity = () => {
    const entity = new QuizGenerationTaskEntity();
    entity.id = faker.string.uuid();
    entity.textContent = faker.lorem.paragraphs(2);
    entity.status = QuizGenerationStatus.PENDING;
    entity.questions = [];
    return entity;
  };

  beforeEach(async () => {
    // Create a mock TypeORM repository
    const mockTypeOrmRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    // Create a mock entity manager
    entityManager = {
      getRepository: jest.fn().mockReturnValue({
        save: jest.fn(),
      }),
    } as unknown as EntityManager;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizGenerationTaskRepositoryImpl,
        {
          provide: getRepositoryToken(QuizGenerationTaskEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<QuizGenerationTaskRepositoryImpl>(
      QuizGenerationTaskRepositoryImpl,
    );
    typeOrmRepository = module.get<Repository<QuizGenerationTaskEntity>>(
      getRepositoryToken(QuizGenerationTaskEntity),
    );
  });

  // Reset mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveTask', () => {
    it('should call save method with the task', async () => {
      // Arrange
      const task = createMockTask();
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValueOnce(task);

      // Act
      await repository.saveTask(task);

      // Assert
      expect(saveSpy).toHaveBeenCalledWith(task);
    });
  });

  describe('save', () => {
    it('should save a task using the repository when no entity manager is provided', async () => {
      // Arrange
      const task = createMockTask();
      const entity = createMockEntity();

      // Mock the mapper
      jest
        .spyOn(QuizGenerationTaskMapper, 'toEntity')
        .mockReturnValueOnce(entity);

      // Act
      await repository.save(task);

      // Assert
      expect(QuizGenerationTaskMapper.toEntity).toHaveBeenCalledWith(task);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(entity);
    });

    it('should save a task using the entity manager when one is provided', async () => {
      // Arrange
      const task = createMockTask();
      const entity = createMockEntity();

      // Mock the mapper
      jest
        .spyOn(QuizGenerationTaskMapper, 'toEntity')
        .mockReturnValueOnce(entity);

      const mockEntityRepo = {
        save: jest.fn().mockResolvedValueOnce(entity),
      };

      (entityManager.getRepository as jest.Mock).mockReturnValueOnce(
        mockEntityRepo,
      );

      // Act
      const result = await repository.save(task, entityManager);

      // Assert
      expect(QuizGenerationTaskMapper.toEntity).toHaveBeenCalledWith(task);
      expect(entityManager.getRepository).toHaveBeenCalledWith(
        QuizGenerationTaskEntity,
      );
      expect(mockEntityRepo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(task);
    });

    it('should handle save errors and propagate them', async () => {
      // Arrange
      const task = createMockTask();
      const error = new Error('Database error');

      (typeOrmRepository.save as jest.Mock).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(repository.save(task)).rejects.toThrow(error);
    });
  });

  describe('findById', () => {
    it('should return a task when found by ID', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const entity = createMockEntity();
      const task = createMockTask();

      (typeOrmRepository.findOne as jest.Mock).mockResolvedValueOnce(entity);
      jest
        .spyOn(QuizGenerationTaskMapper, 'toDomain')
        .mockReturnValueOnce(task);

      // Act
      const result = await repository.findById(taskId);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['questions'],
      });
      expect(QuizGenerationTaskMapper.toDomain).toHaveBeenCalledWith(entity);
      expect(result).toBe(task);
    });

    it('should return null when no task is found', async () => {
      // Arrange
      const taskId = faker.string.uuid();

      (typeOrmRepository.findOne as jest.Mock).mockResolvedValueOnce(null);

      // Act
      const result = await repository.findById(taskId);

      // Assert
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ['questions'],
      });
      expect(result).toBeNull();
    });

    it('should handle errors during find', async () => {
      // Arrange
      const taskId = faker.string.uuid();
      const error = new Error('Database error');

      (typeOrmRepository.findOne as jest.Mock).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(repository.findById(taskId)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      // Arrange
      const entities = [createMockEntity(), createMockEntity()];
      const tasks = [createMockTask(), createMockTask()];

      (typeOrmRepository.find as jest.Mock).mockResolvedValueOnce(entities);
      jest
        .spyOn(QuizGenerationTaskMapper, 'toDomainList')
        .mockReturnValueOnce(tasks);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        relations: ['questions'],
      });
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith(
        entities,
      );
      expect(result).toBe(tasks);
    });

    it('should return empty array when no tasks are found', async () => {
      // Arrange
      (typeOrmRepository.find as jest.Mock).mockResolvedValueOnce([]);
      jest
        .spyOn(QuizGenerationTaskMapper, 'toDomainList')
        .mockReturnValueOnce([]);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(QuizGenerationTaskMapper.toDomainList).toHaveBeenCalledWith([]);
    });

    it('should handle errors during find', async () => {
      // Arrange
      const error = new Error('Database error');

      (typeOrmRepository.find as jest.Mock).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(repository.findAll()).rejects.toThrow(error);
    });
  });
});
