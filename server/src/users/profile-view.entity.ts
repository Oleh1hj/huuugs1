import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Unique } from 'typeorm';

@Entity('profile_views')
@Unique(['viewerId', 'viewedId'])
export class ProfileView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  viewerId: string;

  @Column()
  viewedId: string;

  @UpdateDateColumn()
  viewedAt: Date;
}
