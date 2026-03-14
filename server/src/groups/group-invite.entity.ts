import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { GroupChat } from './group.entity';
import { User } from '../users/user.entity';

@Entity('group_invites')
export class GroupInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column()
  fromUserId: string; // who sent invite / who is requesting

  @Column({ nullable: true })
  toUserId: string; // invitee (null for join-request type)

  @Column({ length: 10, default: 'invite' })
  type: string; // 'invite' | 'request'

  @Column({ length: 12, default: 'pending' })
  status: string; // 'pending' | 'accepted' | 'rejected'

  @ManyToOne(() => GroupChat, (g) => g.invites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: GroupChat;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fromUserId' })
  fromUser: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'toUserId' })
  toUser: User;

  @CreateDateColumn()
  createdAt: Date;
}
