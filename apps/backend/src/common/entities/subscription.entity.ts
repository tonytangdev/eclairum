import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { SubscriptionStatus } from '@eclairum/core/entities';

@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, (user: UserEntity) => user.subscriptions)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  stripeCustomerId: string;

  @Column({ unique: true })
  stripeSubscriptionId: string;

  @Column()
  stripePriceId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.INCOMPLETE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ type: 'boolean', nullable: true })
  cancelAtPeriodEnd: boolean | null;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
