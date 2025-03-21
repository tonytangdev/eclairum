import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuestionEntity } from './question.entity';

@Entity('answers')
export class AnswerEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  content: string;

  @Column()
  isCorrect: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt: Date | null;

  @Column('uuid')
  questionId: string;

  @ManyToOne(() => QuestionEntity, (question) => question.answers)
  @JoinColumn({ name: 'questionId' })
  question: QuestionEntity;
}
