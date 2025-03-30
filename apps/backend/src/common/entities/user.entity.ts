import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SubscriptionEntity } from './subscription.entity';

@Entity('users')
export class UserEntity {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.user)
  subscriptions: SubscriptionEntity[];

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt: Date | null;
}
