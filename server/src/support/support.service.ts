import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportMessage } from './support-message.entity';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportMessage) private readonly repo: Repository<SupportMessage>,
  ) {}

  // User sends a message to support
  async sendMessage(userId: string, text: string): Promise<SupportMessage> {
    const msg = this.repo.create({ userId, text, fromAdmin: false });
    return this.repo.save(msg);
  }

  // Admin replies to a user
  async adminReply(userId: string, text: string): Promise<SupportMessage> {
    const msg = this.repo.create({ userId, text, fromAdmin: true });
    return this.repo.save(msg);
  }

  // Get all messages for the user's conversation
  async getMyMessages(userId: string): Promise<SupportMessage[]> {
    // Mark admin messages as read
    await this.repo.update(
      { userId, fromAdmin: true, isRead: false },
      { isRead: true },
    );
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  // Admin: get list of all users who wrote to support
  async getConversationList(): Promise<{ userId: string; userName: string; lastMessage: string; lastAt: Date; unread: number }[]> {
    const results = await this.repo
      .createQueryBuilder('m')
      .leftJoin('m.user', 'u')
      .select(['m.userId', 'u.name', 'MAX(m.createdAt) as lastAt'])
      .addSelect('u.name', 'userName')
      .addSelect(
        'SUM(CASE WHEN m.fromAdmin = false AND m.isRead = false THEN 1 ELSE 0 END)',
        'unread',
      )
      .groupBy('m.userId')
      .addGroupBy('u.name')
      .orderBy('lastAt', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      userId: r.m_userId,
      userName: r.userName,
      lastMessage: '',
      lastAt: r.lastAt,
      unread: Number(r.unread),
    }));
  }

  // Admin: get messages for specific user
  async getAdminConversation(userId: string): Promise<SupportMessage[]> {
    // Mark user messages as read
    await this.repo.update(
      { userId, fromAdmin: false, isRead: false },
      { isRead: true },
    );
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  // Count unread messages for the user (from admin)
  async countUnreadForUser(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, fromAdmin: true, isRead: false } });
  }

  // Count unread messages for admin (from users)
  async countUnreadForAdmin(): Promise<number> {
    return this.repo.count({ where: { fromAdmin: false, isRead: false } });
  }
}
