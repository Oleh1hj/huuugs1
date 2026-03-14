import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { GroupChat } from './group.entity';
import { User } from '../users/user.entity';

@Entity('group_memberships')
@Index(['groupId', 'userId'], { unique: true })
export class GroupMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column()
  userId: string;

  @Column({ length: 10, default: 'member' })
  role: string; // 'admin' | 'member'

  @ManyToOne(() => GroupChat, (g) => g.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: GroupChat;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  joinedAt: Date;
}
