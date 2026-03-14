import {
  Entity, PrimaryGeneratedColumn, ManyToOne,
  JoinColumn, CreateDateColumn, Column, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('likes')
@Index(['fromUserId', 'toUserId'], { unique: true })
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fromUserId: string;

  @Column()
  toUserId: string;

  @ManyToOne(() => User, (u) => u.givenLikes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fromUserId' })
  fromUser: User;

  @ManyToOne(() => User, (u) => u.receivedLikes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'toUserId' })
  toUser: User;

  @Column({ default: false })
  isSuper: boolean; // true = super-like (costs 1 coin)

  @CreateDateColumn()
  createdAt: Date;
}
