import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Conversation) private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Message) private readonly msgRepo: Repository<Message>,
  ) {}

  /** Get or create a 1-on-1 conversation between two users */
  async findOrCreateConversation(userAId: string, userBId: string): Promise<Conversation> {
    // Normalize order so (A,B) and (B,A) resolve to same row
    const [a, b] = [userAId, userBId].sort();

    let conv = await this.convRepo.findOne({
      where: { userAId: a, userBId: b },
    });

    if (!conv) {
      conv = this.convRepo.create({ userAId: a, userBId: b });
      await this.convRepo.save(conv);
    }

    return conv;
  }

  async removeConversation(userAId: string, userBId: string): Promise<void> {
    const [a, b] = [userAId, userBId].sort();
    const conv = await this.convRepo.findOne({ where: { userAId: a, userBId: b } });
    if (conv) await this.convRepo.remove(conv);
  }

  async getMyConversations(userId: string): Promise<any[]> {
    const convs = await this.convRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.userA', 'ua')
      .leftJoinAndSelect('c.userB', 'ub')
      .where('c.userAId = :uid OR c.userBId = :uid', { uid: userId })
      .getMany();

    // Attach last message to each conversation (for preview + sorting)
    const withLastMsg = await Promise.all(
      convs.map(async (conv) => {
        const lastMessage = await this.msgRepo.findOne({
          where: { conversationId: conv.id },
          order: { createdAt: 'DESC' },
        });
        return Object.assign(conv, { lastMessage: lastMessage ?? null });
      }),
    );

    // Sort newest conversation first
    return withLastMsg.sort((a, b) => {
      const at = a.lastMessage?.createdAt ?? a.createdAt;
      const bt = b.lastMessage?.createdAt ?? b.createdAt;
      return new Date(bt).getTime() - new Date(at).getTime();
    });
  }

  async getMessages(conversationId: string, limit = 50, before?: Date): Promise<Message[]> {
    const qb = this.msgRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 's')
      .where('m.conversationId = :conversationId', { conversationId })
      .orderBy('m.createdAt', 'DESC')
      .take(limit);

    if (before) qb.andWhere('m.createdAt < :before', { before });

    const msgs = await qb.getMany();
    return msgs.reverse(); // chronological order
  }

  async saveMessage(conversationId: string, senderId: string, text: string): Promise<Message> {
    const msg = this.msgRepo.create({ conversationId, senderId, text });
    return this.msgRepo.save(msg);
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    // Only mark messages from the partner (not current user's own messages)
    await this.msgRepo.update(
      { conversationId, isRead: false, senderId: Not(userId) },
      { isRead: true },
    );
  }
}
