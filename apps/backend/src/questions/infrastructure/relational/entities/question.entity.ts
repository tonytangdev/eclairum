import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AnswerEntity } from '../../../../answers/infrastructure/relational/entities/answer.entity';

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

  // Using eager: true can help with TypeORM relationship loading
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @OneToMany(() => AnswerEntity, (answer) => answer.question, {
    cascade: true,
  })
  answers: AnswerEntity[];
}
