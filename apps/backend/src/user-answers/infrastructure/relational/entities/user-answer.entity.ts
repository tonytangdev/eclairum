import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../../../users/infrastructure/relational/entities/user.entity';
import { QuestionEntity } from '../../../../questions/infrastructure/relational/entities/question.entity';
import { AnswerEntity } from '../../../../answers/infrastructure/relational/entities/answer.entity';

@Entity('user_answers')
export class UserAnswerEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column() // Changed from 'uuid' to default string type
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column('uuid')
  questionId: string;

  @ManyToOne(() => QuestionEntity)
  @JoinColumn({ name: 'questionId' })
  question: QuestionEntity;

  @Column('uuid')
  answerId: string;

  @ManyToOne(() => AnswerEntity)
  @JoinColumn({ name: 'answerId' })
  answer: AnswerEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
