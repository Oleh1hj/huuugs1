import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './like.entity';
import { ChatsService } from '../chats/chats.service';
import { UsersService } from '../users/users.service';

export interface LikeResult {
  liked: boolean;
  match: boolean;
  conversationId?: string;
}

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like) private readonly repo: Repository<Like>,
    private readonly chatsService: ChatsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Toggle like from fromUserId → toUserId.
   * If mutual like detected → auto-create conversation.
   * Returns whether the like is now active and whether it's a match.
   */
  async toggle(fromUserId: string, toUserId: string): Promise<LikeResult> {
    const target = await this.usersService.findById(toUserId);
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.repo.findOne({
      where: { fromUserId, toUserId },
    });

    // Un-like
    if (existing) {
      await this.repo.remove(existing);
      // Optionally remove conversation on unlike — uncomment if desired:
      // await this.chatsService.removeConversation(fromUserId, toUserId);
      return { liked: false, match: false };
    }

    // Like
    const like = this.repo.create({ fromUserId, toUserId });
    await this.repo.save(like);

    // Check mutual like
    const mutual = await this.repo.findOne({
      where: { fromUserId: toUserId, toUserId: fromUserId },
    });

    if (mutual) {
      // Mutual like — create conversation automatically!
      const conversation = await this.chatsService.findOrCreateConversation(
        fromUserId,
        toUserId,
      );
      return { liked: true, match: true, conversationId: conversation.id };
    }

    return { liked: true, match: false };
  }

  async getLikedIds(userId: string): Promise<string[]> {
    const likes = await this.repo.find({ where: { fromUserId: userId } });
    return likes.map((l) => l.toUserId);
  }

  async getWhoLikedMe(userId: string) {
    const likes = await this.repo.find({
      where: { toUserId: userId },
      relations: ['fromUser'],
      order: { createdAt: 'DESC' },
    });
    return likes.map((l) => l.fromUser);
  }
}
