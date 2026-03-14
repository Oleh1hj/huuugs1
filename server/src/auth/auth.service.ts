import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await this.usersService.validatePassword(user, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Auto-grant admin rights if email matches ADMIN_EMAIL (even if registered earlier)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && dto.email.toLowerCase() === adminEmail.toLowerCase() && !user.isAdmin) {
      await this.usersService.setAdminFlag(user.id, true);
      user.isAdmin = true;
    }

    return this.issueTokens(user);
  }

  private issueTokens(user: User) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    const { passwordHash: _, ...safeUser } = user as any;
    return { accessToken, refreshToken, user: safeUser };
  }

  async refresh(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
