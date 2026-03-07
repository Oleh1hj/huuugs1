import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  async create(dto: RegisterDto): Promise<User> {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.repo.create({ ...dto, passwordHash });
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

  async findAll(exceptId: string): Promise<User[]> {
    return this.repo.find({
      where: { id: Not(exceptId), isActive: true },
      select: ['id', 'name', 'birth', 'city', 'photo', 'bio'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async updateProfile(
    userId: string,
    data: Partial<Pick<User, 'name' | 'birth' | 'city' | 'bio' | 'photo'>>,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, data);
    return this.repo.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
