import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AnswerEntity } from './answer.entity';
import { QuizGenerationTaskEntity } from './quiz-generation-task.entity';

@Entity('questions')
export class QuestionEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt: Date | null;

  @OneToMany(() => AnswerEntity, (answer) => answer.question, { cascade: true })
  answers: AnswerEntity[];

  @ManyToOne(
    () => QuizGenerationTaskEntity,
    (quizGenerationTask) => quizGenerationTask.questions,
  )
  @JoinColumn({ name: 'quizGenerationTaskId' })
  quizGenerationTask: QuizGenerationTaskEntity;

  @Column({ name: 'quizGenerationTaskId', nullable: true })
  quizGenerationTaskId: string;
}
