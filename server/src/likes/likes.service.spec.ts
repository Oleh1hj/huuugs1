import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LikesService } from './likes.service';
import { Like } from './like.entity';
import { ChatsService } from '../chats/chats.service';
import { ChatsGateway } from '../chats/chats.gateway';
import { UsersService } from '../users/users.service';

const mockUser = (overrides = {}) => ({
  id: 'user-1',
  name: 'Test User',
  photo: null,
  coins: 5,
  birth: '1990-01-01',
  gender: 'male',
  city: 'Kyiv',
  country: 'UA',
  language: 'uk',
  contactFilterGender: null,
  contactFilterAgeMin: null,
  contactFilterAgeMax: null,
  contactFilterSameCity: false,
  contactFilterSameLanguage: false,
  contactFilterSameCountry: false,
  ...overrides,
});

describe('LikesService', () => {
  let service: LikesService;
  let repo: any;
  let usersService: any;
  let chatsService: any;
  let chatsGateway: any;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    usersService = { findById: jest.fn(), updateCoins: jest.fn() };
    chatsService = { findOrCreateConversation: jest.fn() };
    chatsGateway = {
      notifyMatch: jest.fn(),
      notifySuperLike: jest.fn(),
      emitToUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        { provide: getRepositoryToken(Like), useValue: repo },
        { provide: ChatsService, useValue: chatsService },
        { provide: ChatsGateway, useValue: chatsGateway },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(LikesService);
  });

  describe('toggle', () => {
    it('returns liked:false when unliking an existing like', async () => {
      usersService.findById.mockResolvedValue(mockUser({ id: 'user-2' }));
      repo.findOne.mockResolvedValueOnce({ id: 'like-1' }); // existing like
      repo.remove.mockResolvedValue(undefined);

      const result = await service.toggle('user-1', 'user-2');

      expect(repo.remove).toHaveBeenCalled();
      expect(result).toEqual({ liked: false, match: false });
    });

    it('creates a new like and returns liked:true, match:false when no mutual like', async () => {
      usersService.findById.mockResolvedValue(mockUser({ id: 'user-2' }));
      repo.findOne
        .mockResolvedValueOnce(null)  // no existing like from user-1 → user-2
        .mockResolvedValueOnce(null); // no mutual like from user-2 → user-1
      repo.create.mockReturnValue({ fromUserId: 'user-1', toUserId: 'user-2' });
      repo.save.mockResolvedValue({});
      usersService.findById.mockResolvedValue(mockUser({ id: 'user-1' }));

      const result = await service.toggle('user-1', 'user-2');

      expect(repo.save).toHaveBeenCalled();
      expect(result.liked).toBe(true);
      expect(result.match).toBe(false);
    });

    it('creates conversation and notifies match on mutual like', async () => {
      const target = mockUser({ id: 'user-2', name: 'Target' });
      const fromUser = mockUser({ id: 'user-1', name: 'From' });

      usersService.findById
        .mockResolvedValueOnce(target)  // findById(toUserId)
        .mockResolvedValueOnce(fromUser); // findById(fromUserId) in mutual block

      repo.findOne
        .mockResolvedValueOnce(null) // no existing like
        .mockResolvedValueOnce({ id: 'mutual-like' }); // mutual like exists
      repo.create.mockReturnValue({});
      repo.save.mockResolvedValue({});
      chatsService.findOrCreateConversation.mockResolvedValue({ id: 'conv-123' });

      const result = await service.toggle('user-1', 'user-2');

      expect(chatsGateway.notifyMatch).toHaveBeenCalledWith('user-2', expect.objectContaining({
        partnerId: 'user-1',
        conversationId: 'conv-123',
      }));
      expect(result).toEqual({ liked: true, match: true, conversationId: 'conv-123' });
    });

    it('throws NotFoundException when target user does not exist', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.toggle('user-1', 'ghost')).rejects.toThrow(NotFoundException);
    });
  });

  describe('superLike', () => {
    it('throws BadRequestException when user has no coins', async () => {
      usersService.findById
        .mockResolvedValueOnce(mockUser({ id: 'user-1', coins: 0 }))
        .mockResolvedValueOnce(mockUser({ id: 'user-2' }));

      await expect(service.superLike('user-1', 'user-2')).rejects.toThrow(BadRequestException);
    });

    it('deducts coin and sends super-like notification', async () => {
      const fromUser = mockUser({ id: 'user-1', coins: 3 });
      const target = mockUser({ id: 'user-2' });

      usersService.findById.mockResolvedValue(fromUser).mockResolvedValueOnce(fromUser).mockResolvedValueOnce(target);
      repo.findOne
        .mockResolvedValueOnce(null) // no existing like
        .mockResolvedValueOnce(null); // no mutual
      repo.create.mockReturnValue({ fromUserId: 'user-1', toUserId: 'user-2', isSuper: true });
      repo.save.mockResolvedValue({});
      usersService.updateCoins.mockResolvedValue(undefined);

      const result = await service.superLike('user-1', 'user-2');

      expect(usersService.updateCoins).toHaveBeenCalledWith('user-1', 2);
      expect(chatsGateway.notifySuperLike).toHaveBeenCalledWith('user-2', expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.coinsLeft).toBe(2);
    });
  });
});
