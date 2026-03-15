import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { BlockedUser } from './blocked-user.entity';
import { ProfileView } from './profile-view.entity';
import { Report } from './report.entity';
import { Conversation } from '../chats/conversation.entity';
import { Message } from '../chats/message.entity';
import { Like } from '../likes/like.entity';
import { RegisterDto } from '../auth/dto/register.dto';

export interface ProfileFilters {
  gender?: string;
  city?: string;
  ageMin?: number;
  ageMax?: number;
  language?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(BlockedUser) private readonly blockedRepo: Repository<BlockedUser>,
    @InjectRepository(ProfileView) private readonly viewRepo: Repository<ProfileView>,
    @InjectRepository(Report) private readonly reportRepo: Repository<Report>,
    @InjectRepository(Conversation) private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Message) private readonly msgRepo: Repository<Message>,
    @InjectRepository(Like) private readonly likeRepo: Repository<Like>,
  ) {}

  async create(dto: RegisterDto): Promise<User> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = !!(adminEmail && dto.email.toLowerCase() === adminEmail.toLowerCase());
    const premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const user = this.repo.create({ ...dto, passwordHash, isAdmin, isPremium: true, premiumUntil });
    return this.repo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email },
      select: ['id', 'email', 'name', 'passwordHash', 'isActive', 'photo', 'birth', 'city', 'bio'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findPublicById(id: string): Promise<User | null> {
    return this.repo.createQueryBuilder('u')
      .select([
        'u.id', 'u.name', 'u.birth', 'u.city', 'u.photo', 'u.photos',
        'u.bio', 'u.gender', 'u.language', 'u.country',
        'u.lookingForGender', 'u.lookingForCity', 'u.lookingForAgeMin', 'u.lookingForAgeMax',
        'u.isVerified', 'u.isPremium',
      ])
      .where('u.id = :id AND u.isActive = true', { id })
      .getOne();
  }

  async findAll(exceptId: string, filters?: ProfileFilters): Promise<User[]> {
    // Get IDs of users blocked by or blocking this user
    const blockedByMe = await this.blockedRepo.find({ where: { blockerId: exceptId } });
    const blockedMe = await this.blockedRepo.find({ where: { blockedId: exceptId } });
    const excludeIds = [
      exceptId,
      ...blockedByMe.map((b) => b.blockedId),
      ...blockedMe.map((b) => b.blockerId),
    ];

    const qb = this.repo.createQueryBuilder('u')
      .select([
        'u.id', 'u.name', 'u.birth', 'u.city', 'u.photo', 'u.photos',
        'u.bio', 'u.gender', 'u.language', 'u.country',
        'u.lookingForGender', 'u.lookingForCity', 'u.lookingForAgeMin', 'u.lookingForAgeMax',
        'u.whoCanContact', 'u.isVerified', 'u.isPremium',
      ])
      .where('u.id NOT IN (:...excludeIds)', { excludeIds })
      .andWhere('u.isActive = true')
      .orderBy('u.createdAt', 'DESC')
      .take(100);

    if (filters?.gender && filters.gender !== 'any') {
      qb.andWhere('u.gender = :gender', { gender: filters.gender });
    }
    if (filters?.city) {
      qb.andWhere('LOWER(u.city) LIKE :city', { city: `%${filters.city.toLowerCase()}%` });
    }
    if (filters?.ageMin) {
      const maxBirth = new Date();
      maxBirth.setFullYear(maxBirth.getFullYear() - filters.ageMin);
      qb.andWhere('u.birth <= :maxBirth', { maxBirth: maxBirth.toISOString().split('T')[0] });
    }
    if (filters?.ageMax) {
      const minBirth = new Date();
      minBirth.setFullYear(minBirth.getFullYear() - filters.ageMax);
      qb.andWhere('u.birth >= :minBirth', { minBirth: minBirth.toISOString().split('T')[0] });
    }
    if (filters?.language) {
      qb.andWhere('LOWER(u.language) LIKE :language', { language: `%${filters.language.toLowerCase()}%` });
    }

    return qb.getMany();
  }

  async updateProfile(
    userId: string,
    data: Partial<Pick<User,
      'name' | 'birth' | 'city' | 'bio' | 'photo' | 'photos' |
      'gender' | 'language' | 'whoCanContact' | 'country' | 'coins' |
      'contactFilterGender' | 'contactFilterAgeMin' | 'contactFilterAgeMax' |
      'contactFilterSameCity' | 'contactFilterSameLanguage' | 'contactFilterSameCountry' |
      'lookingForGender' | 'lookingForCity' | 'lookingForAgeMin' | 'lookingForAgeMax'
    >>,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, data);
    if (data.photos && data.photos.length > 0) {
      user.photo = data.photos[0];
    }
    return this.repo.save(user);
  }

  async updateCoins(userId: string, coins: number): Promise<void> {
    await this.repo.update({ id: userId }, { coins });
  }

  async claimDailyBonus(userId: string): Promise<{ coins: number; alreadyClaimed: boolean }> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const today = new Date().toISOString().split('T')[0];
    if (user.lastCoinBonusAt === today) {
      return { coins: user.coins, alreadyClaimed: true };
    }
    const newCoins = Math.min(user.coins + 3, 15);
    await this.repo.update({ id: userId }, { coins: newCoins, lastCoinBonusAt: today });
    return { coins: newCoins, alreadyClaimed: false };
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  // ── Block / Unblock ───────────────────────────────────────────────

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) throw new ForbiddenException('Cannot block yourself');
    const existing = await this.blockedRepo.findOne({ where: { blockerId, blockedId } });
    if (!existing) {
      await this.blockedRepo.save(this.blockedRepo.create({ blockerId, blockedId }));
    }
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await this.blockedRepo.delete({ blockerId, blockedId });
  }

  async getBlockedIds(userId: string): Promise<string[]> {
    const rows = await this.blockedRepo.find({ where: { blockerId: userId } });
    return rows.map((r) => r.blockedId);
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const row = await this.blockedRepo.findOne({ where: { blockerId, blockedId } });
    return !!row;
  }

  // ── Reports ───────────────────────────────────────────────────────

  async reportUser(reporterId: string, reportedId: string, reason?: string): Promise<void> {
    if (reporterId === reportedId) throw new ForbiddenException('Cannot report yourself');
    await this.reportRepo.save(this.reportRepo.create({ reporterId, reportedId, reason }));
  }

  // ── Profile views ─────────────────────────────────────────────────

  async recordView(viewerId: string, viewedId: string): Promise<void> {
    if (viewerId === viewedId) return;
    const existing = await this.viewRepo.findOne({ where: { viewerId, viewedId } });
    if (existing) {
      await this.viewRepo.update({ id: existing.id }, { viewedAt: new Date() } as any);
    } else {
      await this.viewRepo.save(this.viewRepo.create({ viewerId, viewedId }));
    }
  }

  async getWhoViewedMe(userId: string): Promise<User[]> {
    const views = await this.viewRepo.find({
      where: { viewedId: userId },
      order: { viewedAt: 'DESC' },
      take: 50,
    });
    if (!views.length) return [];
    const viewerIds = views.map((v) => v.viewerId);
    const users = await this.repo.createQueryBuilder('u')
      .select(['u.id', 'u.name', 'u.birth', 'u.city', 'u.photo', 'u.gender', 'u.isVerified', 'u.isPremium'])
      .where('u.id IN (:...viewerIds)', { viewerIds })
      .getMany();
    // Preserve order
    return viewerIds.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[];
  }

  async getViewCount(userId: string): Promise<number> {
    return this.viewRepo.count({ where: { viewedId: userId } });
  }

  // ── Delete account ────────────────────────────────────────────────

  async deleteAccount(userId: string): Promise<void> {
    // Soft delete: mark inactive and clear personal data
    await this.repo.update({ id: userId }, {
      isActive: false,
      name: 'Deleted User',
      email: `deleted_${userId}@deleted.com`,
      photo: null as any,
      photos: [] as any,
      bio: null as any,
    });
  }

  async setAdminFlag(userId: string, value: boolean): Promise<void> {
    await this.repo.update(userId, { isAdmin: value });
  }

  // ── Admin: verify / set premium ───────────────────────────────────

  async setVerified(adminId: string, userId: string, value: boolean): Promise<void> {
    const admin = await this.findById(adminId);
    if (!admin?.isAdmin) throw new ForbiddenException('Admin only');
    await this.repo.update({ id: userId }, { isVerified: value });
  }

  async setPremium(adminId: string, userId: string, value: boolean, days = 30): Promise<void> {
    const admin = await this.findById(adminId);
    if (!admin?.isAdmin) throw new ForbiddenException('Admin only');
    const until = value ? new Date(Date.now() + days * 86400_000).toISOString().split('T')[0] : null;
    await this.repo.update({ id: userId }, { isPremium: value, premiumUntil: until });
  }

  async adminBanUser(adminId: string, userId: string, ban: boolean): Promise<void> {
    const admin = await this.findById(adminId);
    if (!admin?.isAdmin) throw new ForbiddenException('Admin only');
    await this.repo.update({ id: userId }, { isActive: !ban });
  }

  async adminGetAllUsers(adminId: string): Promise<User[]> {
    const admin = await this.findById(adminId);
    if (!admin?.isAdmin) throw new ForbiddenException('Admin only');
    return this.repo.createQueryBuilder('u')
      .select([
        'u.id', 'u.name', 'u.email', 'u.birth', 'u.city', 'u.photo',
        'u.gender', 'u.language', 'u.country',
        'u.isVerified', 'u.isPremium', 'u.isAdmin', 'u.isActive',
        'u.coins', 'u.createdAt',
      ])
      .orderBy('u.createdAt', 'DESC')
      .take(500)
      .getMany();
  }

  async adminGetReports(adminId: string): Promise<any[]> {
    const admin = await this.findById(adminId);
    if (!admin?.isAdmin) throw new ForbiddenException('Admin only');
    const reports = await this.reportRepo.find({ order: { createdAt: 'DESC' }, take: 200 });
    const userIds = [...new Set([...reports.map((r) => r.reporterId), ...reports.map((r) => r.reportedId)])];
    if (!userIds.length) return [];
    const users = await this.repo.findByIds(userIds);
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    return reports.map((r) => ({
      ...r,
      reporter: userMap[r.reporterId] ? { id: userMap[r.reporterId].id, name: userMap[r.reporterId].name } : null,
      reported: userMap[r.reportedId] ? { id: userMap[r.reportedId].id, name: userMap[r.reportedId].name } : null,
    }));
  }

  async adminGetStats(adminId: string): Promise<any> {
    const admin = await this.findById(adminId);
    if (!admin?.isAdmin) throw new ForbiddenException('Admin only');
    const total = await this.repo.count();
    const active = await this.repo.count({ where: { isActive: true } });
    const premium = await this.repo.count({ where: { isPremium: true } });
    const verified = await this.repo.count({ where: { isVerified: true } });
    const ghostBanned = await this.repo.count({ where: { isGhostBanned: true } });
    const today = new Date().toISOString().split('T')[0];
    const newToday = await this.repo.createQueryBuilder('u')
      .where('u.createdAt >= :today', { today })
      .getCount();
    const reports = await this.reportRepo.count();

    // Gender breakdown
    const male = await this.repo.count({ where: { gender: 'male', isActive: true } });
    const female = await this.repo.count({ where: { gender: 'female', isActive: true } });

    // Total messages, conversations, likes
    const totalMessages = await this.msgRepo.count();
    const totalConversations = await this.convRepo.count();
    const totalLikes = await this.likeRepo.count();

    // Registrations per day last 7 days
    const days7: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const nextDateStr = nextD.toISOString().split('T')[0];
      const count = await this.repo.createQueryBuilder('u')
        .where('u.createdAt >= :from AND u.createdAt < :to', { from: dateStr, to: nextDateStr })
        .getCount();
      days7.push({ date: dateStr, count });
    }

    // Users with photo
    const withPhoto = await this.repo.createQueryBuilder('u')
      .where('u.photo IS NOT NULL AND u.photo != :empty', { empty: '' })
      .getCount();

    return {
      total, active, premium, verified, ghostBanned, newToday, reports,
      male, female,
      totalMessages, totalConversations, totalLikes,
      days7,
      withPhoto,
    };
  }

  async adminGhostBan(adminId: string, userId: string, value: boolean): Promise<void> {
    const admin = await this.findById(adminId);
    if (!admin?.isAdmin) throw new ForbiddenException('Admin only');
    await this.repo.update({ id: userId }, { isGhostBanned: value });
  }

  async adminGetUserConversations(adminId: string, userId: string): Promise<any[]> {
    const admin = await this.findById(adminId);
    if (!admin?.isAdmin) throw new ForbiddenException('Admin only');

    const convs = await this.convRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.userA', 'ua')
      .leftJoinAndSelect('c.userB', 'ub')
      .where('c.userAId = :uid OR c.userBId = :uid', { uid: userId })
      .orderBy('c.createdAt', 'DESC')
      .getMany();

    if (!convs.length) return [];

    const convIds = convs.map((c) => c.id);
    const isPostgres = this.msgRepo.manager.connection.options.type === 'postgres';

    let lastMessages: Message[];
    if (isPostgres) {
      lastMessages = await this.msgRepo.query(
        `SELECT DISTINCT ON ("conversationId") * FROM messages
         WHERE "conversationId" = ANY($1)
         ORDER BY "conversationId", "createdAt" DESC`,
        [convIds],
      );
    } else {
      const allMsgs = await this.msgRepo
        .createQueryBuilder('m')
        .where('m.conversationId IN (:...ids)', { ids: convIds })
        .orderBy('m.createdAt', 'DESC')
        .getMany();
      const seen = new Set<string>();
      lastMessages = allMsgs.filter((m) => {
        if (seen.has(m.conversationId)) return false;
        seen.add(m.conversationId);
        return true;
      });
    }

    const lastMsgMap = new Map(lastMessages.map((m) => [m.conversationId, m]));
    return convs.map((c) => ({
      id: c.id,
      partnerA: { id: c.userA?.id, name: c.userA?.name, photo: c.userA?.photo },
      partnerB: { id: c.userB?.id, name: c.userB?.name, photo: c.userB?.photo },
      lastMessage: lastMsgMap.get(c.id) ?? null,
      createdAt: c.createdAt,
    }));
  }

  async adminGetConversationMessages(adminId: string, conversationId: string): Promise<Message[]> {
    const admin = await this.findById(adminId);
    if (!admin?.isAdmin) throw new ForbiddenException('Admin only');

    const msgs = await this.msgRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 's')
      .where('m.conversationId = :cid', { cid: conversationId })
      .orderBy('m.createdAt', 'ASC')
      .take(200)
      .getMany();
    return msgs;
  }
}
