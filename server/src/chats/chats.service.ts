import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Or, Equal } from 'typeorm';
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

  async getMyConversations(userId: string): Promise<Conversation[]> {
    return this.convRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.userA', 'ua')
      .leftJoinAndSelect('c.userB', 'ub')
      .leftJoin(
        (qb) =>
          qb
            .select('m.conversationId', 'cid')
            .addSelect('MAX(m.createdAt)', 'lastAt')
            .from(Message, 'm')
            .groupBy('m.conversationId'),
        'last',
        'last.cid = c.id',
      )
      .where('c.userAId = :uid OR c.userBId = :uid', { uid: userId })
      .orderBy('last.lastAt', 'DESC', 'NULLS LAST')
      .getMany();
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
    await this.msgRepo.update(
      { conversationId, isRead: false },
      { isRead: true },
    );
  }
}
