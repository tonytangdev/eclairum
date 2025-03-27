import { QuizProcessor } from "../../interfaces/quiz-processor.interface";
import {
  QuizGenerationTask,
  QuizGenerationStatus,
} from "../../entities/quiz-generation-task";
import { Question } from "../../entities/question";

type ProcessingStep = {
  action: (task: QuizGenerationTask) => void;
  delay?: number;
};

type ProcessingContext = {
  task: QuizGenerationTask;
  text: string;
  startTime: Date;
  completedSteps: number;
};

/**
 * Enhanced mock implementation of QuizProcessor for testing
 * Provides advanced capabilities for controlling quiz processing behavior in tests
 */
export class MockQuizProcessor implements QuizProcessor {
  private callCount = 0;
  private processingHistory: Array<{ task: QuizGenerationTask; text: string }> =
    [];
  private customErrorMessage?: string;
  private simulateQuestions: Question[] = [];
  private simulateTitle?: string;
  private customUpdateTaskFn?: (task: QuizGenerationTask) => void;
  private processingSteps: ProcessingStep[] = [];
  private onProgressCallback?: (context: ProcessingContext) => void;
  private activeProcessingContexts: Map<string, ProcessingContext> = new Map();

  /**
   * Creates a new instance of MockQuizProcessor with advanced testing capabilities
   *
   * @param shouldResolve Whether the process should resolve successfully (true) or reject with an error (false)
   * @param delay Optional delay in ms to simulate processing time
   * @param updateTaskStatus Whether to automatically update task status based on shouldResolve (COMPLETED or FAILED)
   */
  constructor(
    private readonly shouldResolve: boolean = true,
    private readonly delay = 0,
    private readonly updateTaskStatus = true,
  ) {}

  /**
   * Enhanced mock implementation of processQuizGeneration with call tracking
   * and customizable behavior
   */
  async processQuizGeneration(
    quizGenerationTask: QuizGenerationTask,
    text: string,
  ): Promise<void> {
    this.callCount++;
    this.processingHistory.push({ task: quizGenerationTask, text });

    // Create a processing context to track this execution
    const context: ProcessingContext = {
      task: quizGenerationTask,
      text,
      startTime: new Date(),
      completedSteps: 0,
    };

    this.activeProcessingContexts.set(quizGenerationTask.getId(), context);

    try {
      // If we have defined processing steps, execute them sequentially
      if (this.processingSteps.length > 0) {
        await this.executeProcessingSteps(context);
        return;
      }

      // Standard processing behavior
      if (this.delay > 0) {
        await new Promise<void>((resolve) =>
          setTimeout(() => resolve(), this.delay),
        );
      }

      // Handle failure case
      if (!this.shouldResolve) {
        if (this.updateTaskStatus) {
          quizGenerationTask.updateStatus(QuizGenerationStatus.FAILED);
        }

        throw new Error(
          this.customErrorMessage || "Mock quiz generation failure",
        );
      }

      // Handle success case
      if (this.updateTaskStatus) {
        this.updateTaskWithSimulatedData(quizGenerationTask);
      }
    } finally {
      // Clean up the context
      this.activeProcessingContexts.delete(quizGenerationTask.getId());
    }
  }

  /**
   * Execute the defined processing steps sequentially
   */
  private async executeProcessingSteps(
    context: ProcessingContext,
  ): Promise<void> {
    const { task } = context;

    for (let i = 0; i < this.processingSteps.length; i++) {
      const step = this.processingSteps[i];

      // Delay if specified
      if (step.delay && step.delay > 0) {
        await new Promise<void>((resolve) =>
          setTimeout(() => resolve(), step.delay),
        );
      }

      // Execute the step action
      step.action(task);

      // Update progress
      context.completedSteps = i + 1;

      // Notify progress listener if registered
      if (this.onProgressCallback) {
        this.onProgressCallback(context);
      }

      // If we're not supposed to succeed and this is the last step, throw error
      if (!this.shouldResolve && i === this.processingSteps.length - 1) {
        if (this.updateTaskStatus) {
          task.updateStatus(QuizGenerationStatus.FAILED);
        }
        throw new Error(
          this.customErrorMessage || "Mock quiz generation failure",
        );
      }
    }

    // Complete the task if we should resolve and updateTaskStatus is true
    if (this.shouldResolve && this.updateTaskStatus) {
      task.updateStatus(QuizGenerationStatus.COMPLETED);
    }
  }

  /**
   * Update task with simulated data (questions, title, etc.)
   */
  private updateTaskWithSimulatedData(
    quizGenerationTask: QuizGenerationTask,
  ): void {
    // Add any simulated questions
    if (this.simulateQuestions.length > 0) {
      this.simulateQuestions.forEach((question) => {
        quizGenerationTask.addQuestion(question);
      });
    }

    // Set title if provided
    if (this.simulateTitle) {
      quizGenerationTask.setTitle(this.simulateTitle);
    }

    // Run any custom update function
    if (this.customUpdateTaskFn) {
      this.customUpdateTaskFn(quizGenerationTask);
    }

    quizGenerationTask.updateStatus(QuizGenerationStatus.COMPLETED);
  }

  /**
   * Define the processing steps for step-by-step simulation
   * Each step will be executed sequentially with the specified delay
   */
  withProcessingSteps(steps: ProcessingStep[]): this {
    this.processingSteps = [...steps];
    return this;
  }

  /**
   * Add a callback to be notified of progress during step-by-step processing
   */
  withProgressCallback(callback: (context: ProcessingContext) => void): this {
    this.onProgressCallback = callback;
    return this;
  }

  /**
   * Get the current processing context for a task if it's active
   */
  getProcessingContext(taskId: string): ProcessingContext | undefined {
    return this.activeProcessingContexts.get(taskId);
  }

  /**
   * Set a custom error message to throw when shouldResolve is false
   */
  withErrorMessage(message: string): this {
    this.customErrorMessage = message;
    return this;
  }

  /**
   * Set questions to be added to the task when processing completes successfully
   */
  withQuestions(questions: Question[]): this {
    this.simulateQuestions = [...questions];
    return this;
  }

  /**
   * Set a title to be applied to the task when processing completes successfully
   */
  withTitle(title: string): this {
    this.simulateTitle = title;
    return this;
  }

  /**
   * Set a custom function to update the task during processing
   */
  withCustomTaskUpdate(updateFn: (task: QuizGenerationTask) => void): this {
    this.customUpdateTaskFn = updateFn;
    return this;
  }

  /**
   * Get the number of times processQuizGeneration was called
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * Check if processQuizGeneration was called
   */
  wasCalled(): boolean {
    return this.callCount > 0;
  }

  /**
   * Get the history of tasks and texts processed
   */
  getProcessingHistory(): Array<{ task: QuizGenerationTask; text: string }> {
    return [...this.processingHistory];
  }

  /**
   * Get the last processed task and text, or undefined if none was processed
   */
  getLastProcessedItem():
    | { task: QuizGenerationTask; text: string }
    | undefined {
    if (this.processingHistory.length === 0) {
      return undefined;
    }
    return this.processingHistory[this.processingHistory.length - 1];
  }

  /**
   * Reset all tracking data
   */
  reset(): void {
    this.callCount = 0;
    this.processingHistory = [];
    this.activeProcessingContexts.clear();
  }
}
