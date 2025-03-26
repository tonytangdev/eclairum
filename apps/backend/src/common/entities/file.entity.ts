import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { QuizGenerationTaskEntity } from './quiz-generation-task.entity';

/**
 * Entity representing a file stored in the database
 * Has a one-to-one relationship with QuizGenerationTask
 */
@Entity('files')
export class FileEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('text')
  path: string;

  @Column('text')
  bucketName: string;

  @Column('uuid')
  quizGenerationTaskId: string;

  @OneToOne(
    () => QuizGenerationTaskEntity,
    (quizGenerationTask) => quizGenerationTask.file,
  )
  @JoinColumn({ name: 'quizGenerationTaskId' })
  quizGenerationTask: QuizGenerationTaskEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
