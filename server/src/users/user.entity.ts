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

  @Column({ nullable: true, type: 'text' })
  photo: string;

  @Column({ type: 'jsonb', default: [] })
  photos: string[]; // up to 5 photos (carousel)

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ length: 10, default: 'male' })
  gender: string; // 'male' | 'female'

  @Column({ length: 100, default: 'Українська' })
  language: string;

  @Column({ length: 10, default: 'any' })
  lookingForGender: string; // 'male' | 'female' | 'any'

  @Column({ length: 100, nullable: true })
  lookingForCity: string;

  @Column({ type: 'int', nullable: true })
  lookingForAgeMin: number;

  @Column({ type: 'int', nullable: true })
  lookingForAgeMax: number;

  @Column({ length: 20, default: 'anyone' })
  whoCanContact: string; // 'anyone' | 'liked_me' | 'mutual'

  @Column({ default: false })
  isAdmin: boolean;

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
