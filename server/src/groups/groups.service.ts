import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupChat } from './group.entity';
import { GroupMembership } from './group-membership.entity';
import { GroupMessage } from './group-message.entity';
import { GroupInvite } from './group-invite.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(GroupChat) private readonly groupRepo: Repository<GroupChat>,
    @InjectRepository(GroupMembership) private readonly memberRepo: Repository<GroupMembership>,
    @InjectRepository(GroupMessage) private readonly msgRepo: Repository<GroupMessage>,
    @InjectRepository(GroupInvite) private readonly inviteRepo: Repository<GroupInvite>,
  ) {}

  /** Create a new group and add creator as admin */
  async createGroup(createdById: string, name: string, description?: string): Promise<GroupChat> {
    const group = this.groupRepo.create({ name, description, createdById });
    await this.groupRepo.save(group);
    const membership = this.memberRepo.create({ groupId: group.id, userId: createdById, role: 'admin' });
    await this.memberRepo.save(membership);
    return group;
  }

  /** Get all groups the user is a member of */
  async getMyGroups(userId: string): Promise<any[]> {
    const memberships = await this.memberRepo.find({
      where: { userId },
      relations: ['group'],
    });

    const groups = await Promise.all(
      memberships.map(async (m) => {
        const memberCount = await this.memberRepo.count({ where: { groupId: m.groupId } });
        const lastMessage = await this.msgRepo.findOne({
          where: { groupId: m.groupId },
          order: { createdAt: 'DESC' },
          relations: ['sender'],
        });
        return { ...m.group, memberCount, lastMessage: lastMessage ?? null, myRole: m.role };
      }),
    );

    return groups.sort((a, b) => {
      const at = a.lastMessage?.createdAt ?? a.createdAt;
      const bt = b.lastMessage?.createdAt ?? b.createdAt;
      return new Date(bt).getTime() - new Date(at).getTime();
    });
  }

  /** Get group details with members */
  async getGroupDetails(groupId: string, userId: string): Promise<any> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const membership = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!membership) throw new ForbiddenException('Not a member');

    const members = await this.memberRepo.find({
      where: { groupId },
      relations: ['user'],
    });

    const pendingInvites = await this.inviteRepo.find({
      where: { groupId, status: 'pending', type: 'invite' },
      relations: ['toUser'],
    });

    const pendingRequests = await this.inviteRepo.find({
      where: { groupId, status: 'pending', type: 'request' },
      relations: ['fromUser'],
    });

    return {
      ...group,
      members: members.map((m) => ({ ...m.user, role: m.role })),
      pendingInvites,
      pendingRequests,
      myRole: membership.role,
    };
  }

  /** Get messages for a group */
  async getMessages(groupId: string, userId: string, limit = 50, before?: Date): Promise<GroupMessage[]> {
    const membership = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!membership) throw new ForbiddenException('Not a member');

    const qb = this.msgRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 's')
      .where('m.groupId = :groupId', { groupId })
      .orderBy('m.createdAt', 'DESC')
      .take(limit);

    if (before) qb.andWhere('m.createdAt < :before', { before });

    const msgs = await qb.getMany();
    return msgs.reverse();
  }

  /** Save a group message */
  async saveMessage(groupId: string, senderId: string, text: string): Promise<GroupMessage> {
    const membership = await this.memberRepo.findOne({ where: { groupId, userId: senderId } });
    if (!membership) throw new ForbiddenException('Not a member');

    const msg = this.msgRepo.create({ groupId, senderId, text });
    return this.msgRepo.save(msg);
  }

  /** Invite a user to a group */
  async inviteUser(groupId: string, fromUserId: string, toUserId: string): Promise<GroupInvite> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const fromMembership = await this.memberRepo.findOne({ where: { groupId, userId: fromUserId } });
    if (!fromMembership) throw new ForbiddenException('Not a member');

    const memberCount = await this.memberRepo.count({ where: { groupId } });
    if (memberCount >= group.maxMembers) throw new BadRequestException('Group is full');

    const alreadyMember = await this.memberRepo.findOne({ where: { groupId, userId: toUserId } });
    if (alreadyMember) throw new BadRequestException('Already a member');

    const existingInvite = await this.inviteRepo.findOne({
      where: { groupId, toUserId, type: 'invite', status: 'pending' },
    });
    if (existingInvite) throw new BadRequestException('Invite already sent');

    const invite = this.inviteRepo.create({ groupId, fromUserId, toUserId, type: 'invite' });
    return this.inviteRepo.save(invite);
  }

  /** Send a join request */
  async requestJoin(groupId: string, fromUserId: string): Promise<GroupInvite> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    const alreadyMember = await this.memberRepo.findOne({ where: { groupId, userId: fromUserId } });
    if (alreadyMember) throw new BadRequestException('Already a member');

    const existing = await this.inviteRepo.findOne({
      where: { groupId, fromUserId, type: 'request', status: 'pending' },
    });
    if (existing) throw new BadRequestException('Request already sent');

    const memberCount = await this.memberRepo.count({ where: { groupId } });
    if (memberCount >= group.maxMembers) throw new BadRequestException('Group is full');

    const request = this.inviteRepo.create({ groupId, fromUserId, toUserId: null as any, type: 'request' });
    return this.inviteRepo.save(request);
  }

  /** Respond to an invite or join request */
  async respondToInvite(inviteId: string, userId: string, accept: boolean): Promise<void> {
    const invite = await this.inviteRepo.findOne({
      where: { id: inviteId },
      relations: ['group'],
    });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.status !== 'pending') throw new BadRequestException('Already responded');

    if (invite.type === 'invite') {
      // Only the invitee can respond
      if (invite.toUserId !== userId) throw new ForbiddenException();
    } else {
      // For join requests, any member can respond
      const membership = await this.memberRepo.findOne({ where: { groupId: invite.groupId, userId } });
      if (!membership) throw new ForbiddenException('Not a member');
    }

    invite.status = accept ? 'accepted' : 'rejected';
    await this.inviteRepo.save(invite);

    if (accept) {
      const group = invite.group;
      const memberCount = await this.memberRepo.count({ where: { groupId: invite.groupId } });
      if (memberCount >= group.maxMembers) throw new BadRequestException('Group is full');

      const newMemberId = invite.type === 'invite' ? invite.toUserId : invite.fromUserId;
      const membership = this.memberRepo.create({ groupId: invite.groupId, userId: newMemberId, role: 'member' });
      await this.memberRepo.save(membership);
    }
  }

  /** Get pending invites sent to user */
  async getMyInvites(userId: string): Promise<GroupInvite[]> {
    return this.inviteRepo.find({
      where: { toUserId: userId, type: 'invite', status: 'pending' },
      relations: ['group', 'fromUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Leave a group */
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const membership = await this.memberRepo.findOne({ where: { groupId, userId } });
    if (!membership) throw new NotFoundException('Not a member');
    await this.memberRepo.remove(membership);
  }

  /** Get user's memberships (for auto-joining socket rooms) */
  async getUserMemberships(userId: string): Promise<GroupMembership[]> {
    return this.memberRepo.find({ where: { userId } });
  }
}
