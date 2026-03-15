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

    if (convs.length === 0) return [];

    const convIds = convs.map((c) => c.id);
    const isPostgres = this.msgRepo.manager.connection.options.type === 'postgres';

    let lastMessages: Message[];
    let unreadCounts: { conversationId: string; count: string }[];

    if (isPostgres) {
      // PostgreSQL: efficient DISTINCT ON query
      lastMessages = await this.msgRepo.query(
        `SELECT DISTINCT ON ("conversationId") * FROM messages
         WHERE "conversationId" = ANY($1)
         ORDER BY "conversationId", "createdAt" DESC`,
        [convIds],
      );
      unreadCounts = await this.msgRepo.query(
        `SELECT "conversationId", COUNT(*) as count FROM messages
         WHERE "conversationId" = ANY($1) AND "senderId" != $2 AND "isRead" = false
         GROUP BY "conversationId"`,
        [convIds, userId],
      );
    } else {
      // SQLite / other DBs: use TypeORM QueryBuilder (compatible syntax)
      const allMsgs = await this.msgRepo
        .createQueryBuilder('m')
        .where('m.conversationId IN (:...ids)', { ids: convIds })
        .orderBy('m.createdAt', 'DESC')
        .getMany();

      // Keep only the latest message per conversation
      const seen = new Set<string>();
      lastMessages = allMsgs.filter((m) => {
        if (seen.has(m.conversationId)) return false;
        seen.add(m.conversationId);
        return true;
      });

      const unreadRaw = await this.msgRepo
        .createQueryBuilder('m')
        .select('m.conversationId', 'conversationId')
        .addSelect('COUNT(*)', 'count')
        .where('m.conversationId IN (:...ids)', { ids: convIds })
        .andWhere('m.senderId != :uid', { uid: userId })
        .andWhere('m.isRead = :r', { r: false })
        .groupBy('m.conversationId')
        .getRawMany();
      unreadCounts = unreadRaw;
    }

    const lastMsgMap = new Map(lastMessages.map((m) => [m.conversationId, m]));
    const unreadMap = new Map(unreadCounts.map((r) => [r.conversationId, parseInt(r.count, 10)]));

    const withLastMsg = convs.map((conv) =>
      Object.assign(conv, {
        lastMessage: lastMsgMap.get(conv.id) ?? null,
        unreadCount: unreadMap.get(conv.id) ?? 0,
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

  async findConversationById(id: string): Promise<Conversation | null> {
    return this.convRepo.findOne({ where: { id } });
  }

  async saveMessage(conversationId: string, senderId: string, text: string): Promise<Message> {
    const msg = this.msgRepo.create({ conversationId, senderId, text });
    const saved = await this.msgRepo.save(msg);
    console.log(`[DB] message saved id=${saved.id} conv=${conversationId} sender=${senderId}`);
    return saved;
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    // Only mark messages from the partner (not current user's own messages)
    await this.msgRepo.update(
      { conversationId, isRead: false, senderId: Not(userId) },
      { isRead: true },
    );
  }
}
