import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { RegisterDto } from '../auth/dto/register.dto';

export interface ProfileFilters {
  gender?: string;
  city?: string;
  ageMin?: number;
  ageMax?: number;
}

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

  async findAll(exceptId: string, filters?: ProfileFilters): Promise<User[]> {
    const qb = this.repo.createQueryBuilder('u')
      .select(['u.id', 'u.name', 'u.birth', 'u.city', 'u.photo', 'u.bio', 'u.gender', 'u.language', 'u.lookingForGender', 'u.lookingForCity', 'u.lookingForAgeMin', 'u.lookingForAgeMax'])
      .where('u.id != :id', { id: exceptId })
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

    return qb.getMany();
  }

  async updateProfile(
    userId: string,
    data: Partial<Pick<User, 'name' | 'birth' | 'city' | 'bio' | 'photo' | 'gender' | 'language' | 'lookingForGender' | 'lookingForCity' | 'lookingForAgeMin' | 'lookingForAgeMax'>>,
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
