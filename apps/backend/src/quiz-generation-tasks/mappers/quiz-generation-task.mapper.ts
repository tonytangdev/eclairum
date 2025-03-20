import { QuizGenerationTask } from '@eclairum/core/entities';
import { TaskDetailResponse } from '../dto/fetch-quiz-generation-task.response.dto';
import {
  TaskResponse,
  TaskSummaryResponse,
} from '../dto/fetch-quiz-generation-tasks.response.dto';

export class QuizGenerationTaskMapper {
  /**
   * Maps a QuizGenerationTask entity to a TaskResponse DTO
   */
  toTaskResponse(task: QuizGenerationTask, userId: string): TaskResponse {
    const taskId = task.getId();
    const questionsCount = task.getQuestions().length;

    return {
      taskId,
      userId,
      status: task.getStatus(),
      questionsCount,
      message: `Quiz generation task created with ${questionsCount} questions`,
      generatedAt: task.getGeneratedAt()!,
    };
  }

  /**
   * Maps a QuizGenerationTask entity to a TaskDetailResponse DTO
   */
  toTaskDetailResponse(task: QuizGenerationTask): TaskDetailResponse {
    const questions = task.getQuestions().map((question) => ({
      id: question.getId(),
      text: question.getContent(),
      answers: question.getAnswers().map((answer) => ({
        id: answer.getId(),
        text: answer.getContent(),
        isCorrect: answer.getIsCorrect(),
      })),
    }));

    return {
      id: task.getId(),
      status: task.getStatus(),
      title: task.getTitle(),
      createdAt: task.getCreatedAt(),
      updatedAt: task.getUpdatedAt(),
      generatedAt: task.getGeneratedAt(),
      questions,
    };
  }

  /**
   * Maps a QuizGenerationTask entity to a TaskSummaryResponse DTO
   */
  toTaskSummaryResponse(task: QuizGenerationTask): TaskSummaryResponse {
    return {
      id: task.getId(),
      status: task.getStatus(),
      title: task.getTitle(),
      createdAt: task.getCreatedAt(),
      updatedAt: task.getUpdatedAt(),
      questionsCount: task.getQuestions().length,
    };
  }
}
