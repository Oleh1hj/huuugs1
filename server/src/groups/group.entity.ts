import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany,
} from 'typeorm';
import { GroupMembership } from './group-membership.entity';
import { GroupMessage } from './group-message.entity';
import { GroupInvite } from './group-invite.entity';

@Entity('group_chats')
export class GroupChat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 80 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  createdById: string;

  @Column({ type: 'int', default: 12 })
  maxMembers: number;

  @OneToMany(() => GroupMembership, (m) => m.group)
  memberships: GroupMembership[];

  @OneToMany(() => GroupMessage, (m) => m.group)
  messages: GroupMessage[];

  @OneToMany(() => GroupInvite, (i) => i.group)
  invites: GroupInvite[];

  @CreateDateColumn()
  createdAt: Date;
}
