import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('blocked_users')
@Unique(['blockerId', 'blockedId'])
export class BlockedUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  blockerId: string;

  @Column()
  blockedId: string;

  @CreateDateColumn()
  createdAt: Date;
}
