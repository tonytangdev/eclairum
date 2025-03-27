import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { QuizGenerationStatus } from '@eclairum/core/entities';
import { QuestionEntity } from './question.entity';
import { UserEntity } from './user.entity';
import { FileEntity } from './file.entity';

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

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => QuestionEntity, (question) => question.quizGenerationTask)
  questions: QuestionEntity[];

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  fileId: string | null;

  @OneToOne(() => FileEntity, (file) => file.quizGenerationTask)
  @JoinColumn({ name: 'fileId' })
  file: FileEntity | null;
}
