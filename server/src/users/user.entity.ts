import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Like } from '../likes/like.entity';
import { Message } from '../chats/message.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false }) // never return password in queries
  passwordHash: string;

  @Column({ type: 'date' })
  birth: string;

  @Column({ length: 100 })
  city: string;

  @Column({ nullable: true, length: 255 })
  photo: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Like, (like) => like.fromUser)
  givenLikes: Like[];

  @OneToMany(() => Like, (like) => like.toUser)
  receivedLikes: Like[];

  @OneToMany(() => Message, (m) => m.sender)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
