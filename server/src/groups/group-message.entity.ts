import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { GroupChat } from './group.entity';
import { User } from '../users/user.entity';

@Entity('group_messages')
@Index(['groupId', 'createdAt'])
export class GroupMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column()
  senderId: string;

  @Column({ type: 'text' })
  text: string;

  @ManyToOne(() => GroupChat, (g) => g.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: GroupChat;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @CreateDateColumn()
  createdAt: Date;
}
