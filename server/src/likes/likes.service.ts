import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './like.entity';
import { ChatsService } from '../chats/chats.service';
import { ChatsGateway } from '../chats/chats.gateway';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

export interface LikeResult {
  liked: boolean;
  match: boolean;
  conversationId?: string;
}

export interface SuperLikeResult {
  success: boolean;
  coinsLeft: number;
  match: boolean;
  conversationId?: string;
}

/** Calculate age from ISO date string */
function calcAge(birth: string): number {
  const today = new Date();
  const b = new Date(birth);
  let age = today.getFullYear() - b.getFullYear();
  if (
    today.getMonth() < b.getMonth() ||
    (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())
  ) {
    age--;
  }
  return age;
}

/** Check whether `from` meets the contact filter criteria set by `to` */
function meetsContactFilters(from: User, to: User): boolean {
  if (to.contactFilterGender && to.contactFilterGender !== 'any') {
    if (from.gender !== to.contactFilterGender) return false;
  }
  if (to.contactFilterAgeMin || to.contactFilterAgeMax) {
    const age = calcAge(from.birth);
    if (to.contactFilterAgeMin && age < to.contactFilterAgeMin) return false;
    if (to.contactFilterAgeMax && age > to.contactFilterAgeMax) return false;
  }
  if (to.contactFilterSameCity && from.city !== to.city) return false;
  if (to.contactFilterSameLanguage && from.language !== to.language) return false;
  if (to.contactFilterSameCountry && from.country !== to.country) return false;
  return true;
}

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like) private readonly repo: Repository<Like>,
    private readonly chatsService: ChatsService,
    private readonly chatsGateway: ChatsGateway,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Toggle like from fromUserId → toUserId.
   * Mutual like + contact filters pass → auto-create conversation.
   */
  async toggle(fromUserId: string, toUserId: string): Promise<LikeResult> {
    const target = await this.usersService.findById(toUserId);
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.repo.findOne({ where: { fromUserId, toUserId } });

    if (existing) {
      await this.repo.remove(existing);
      return { liked: false, match: false };
    }

    const like = this.repo.create({ fromUserId, toUserId });
    await this.repo.save(like);

    const mutual = await this.repo.findOne({
      where: { fromUserId: toUserId, toUserId: fromUserId },
    });

    if (mutual) {
      const fromUser = await this.usersService.findById(fromUserId);
      if (!fromUser) return { liked: true, match: false };

      // Enforce target's contact filters before creating conversation
      if (!meetsContactFilters(fromUser, target)) {
        return { liked: true, match: false };
      }

      const conversation = await this.chatsService.findOrCreateConversation(fromUserId, toUserId);

      this.chatsGateway.notifyMatch(toUserId, {
        partnerId: fromUserId,
        partnerName: fromUser.name,
        partnerPhoto: fromUser.photo ?? null,
        conversationId: conversation.id,
      });

      return { liked: true, match: true, conversationId: conversation.id };
    }

    return { liked: true, match: false };
  }

  /**
   * Super-like: costs 1 coin. Creates/upgrades like to isSuper=true.
   * Notifies the target via WebSocket event 'super-like'.
   */
  async superLike(fromUserId: string, toUserId: string): Promise<SuperLikeResult> {
    const fromUser = await this.usersService.findById(fromUserId);
    const target = await this.usersService.findById(toUserId);

    if (!fromUser || !target) throw new NotFoundException('User not found');
    if ((fromUser.coins ?? 0) < 1) throw new BadRequestException('Not enough coins');

    // Deduct 1 coin
    await this.usersService.updateCoins(fromUserId, fromUser.coins - 1);

    // Create or upgrade existing like to super
    let like = await this.repo.findOne({ where: { fromUserId, toUserId } });
    if (!like) {
      like = this.repo.create({ fromUserId, toUserId, isSuper: true });
    } else {
      like.isSuper = true;
    }
    await this.repo.save(like);

    // Notify target about super-like via WebSocket
    this.chatsGateway.notifySuperLike(toUserId, {
      fromId: fromUserId,
      fromName: fromUser.name,
      fromPhoto: fromUser.photo ?? null,
    });

    // Check mutual → maybe create conversation
    const mutual = await this.repo.findOne({
      where: { fromUserId: toUserId, toUserId: fromUserId },
    });

    const coinsLeft = fromUser.coins - 1;

    if (mutual && meetsContactFilters(fromUser, target)) {
      const conversation = await this.chatsService.findOrCreateConversation(fromUserId, toUserId);
      this.chatsGateway.notifyMatch(toUserId, {
        partnerId: fromUserId,
        partnerName: fromUser.name,
        partnerPhoto: fromUser.photo ?? null,
        conversationId: conversation.id,
      });
      return { success: true, coinsLeft, match: true, conversationId: conversation.id };
    }

    return { success: true, coinsLeft, match: false };
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
    // Attach isSuper flag to each user object
    return likes.map((l) => ({ ...l.fromUser, isSuper: l.isSuper }));
  }
}
