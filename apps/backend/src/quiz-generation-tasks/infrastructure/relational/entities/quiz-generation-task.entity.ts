import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { QuizGenerationStatus } from '@flash-me/core/entities';
import { QuestionEntity } from '../../../../questions/infrastructure/relational/entities/question.entity';

@Entity('quiz_generation_tasks')
export class QuizGenerationTaskEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('text')
  textContent: string;

  @Column({
    type: 'enum',
    enum: QuizGenerationStatus,
    default: QuizGenerationStatus.PENDING,
  })
  status: QuizGenerationStatus;

  @Column({ type: 'timestamp', nullable: true })
  generatedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => QuestionEntity, (question) => question.quizGenerationTask)
  questions: QuestionEntity[];
}
