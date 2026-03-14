import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './user.entity';
import { UsersService } from './users.service';
import {
  IsOptional, IsString, MaxLength, IsDateString, IsIn, IsInt, Min, Max, IsArray, IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(50) name?: string;
  @IsOptional() @IsDateString() birth?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @IsOptional() @IsString() photo?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) photos?: string[];
  @IsOptional() @IsIn(['male', 'female']) gender?: string;
  @IsOptional() @IsString() @MaxLength(100) language?: string;
  @IsOptional() @IsString() @MaxLength(100) country?: string;
  @IsOptional() @IsIn(['male', 'female', 'any']) lookingForGender?: string;
  @IsOptional() @IsString() @MaxLength(100) lookingForCity?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(18) @Max(100) lookingForAgeMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(18) @Max(100) lookingForAgeMax?: number;
  @IsOptional() @IsIn(['anyone', 'liked_me', 'mutual']) whoCanContact?: string;
  @IsOptional() @IsIn(['any', 'male', 'female']) contactFilterGender?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(18) @Max(100) contactFilterAgeMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(18) @Max(100) contactFilterAgeMax?: number;
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() contactFilterSameCity?: boolean;
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() contactFilterSameLanguage?: boolean;
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() contactFilterSameCountry?: boolean;
}

class ProfilesQueryDto {
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(18) ageMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(18) ageMax?: number;
}

class ReportDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

class AdminActionDto {
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() value?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) days?: number;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profiles')
  getProfiles(@CurrentUser() user: User, @Query() query: ProfilesQueryDto) {
    return this.usersService.findAll(user.id, {
      gender: query.gender,
      city: query.city,
      ageMin: query.ageMin,
      ageMax: query.ageMax,
    });
  }

  @Get('blocked')
  getBlocked(@CurrentUser() user: User) {
    return this.usersService.getBlockedIds(user.id);
  }

  @Get('who-viewed-me')
  getWhoViewedMe(@CurrentUser() user: User) {
    return this.usersService.getWhoViewedMe(user.id);
  }

  @Get('view-count')
  getViewCount(@CurrentUser() user: User) {
    return this.usersService.getViewCount(user.id).then((count) => ({ count }));
  }

  @Get(':id')
  async getPublicProfile(@CurrentUser() me: User, @Param('id') id: string) {
    // Record that me viewed this profile
    this.usersService.recordView(me.id, id).catch(() => {});
    return this.usersService.findPublicById(id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Delete('me')
  @HttpCode(204)
  async deleteMe(@CurrentUser() user: User) {
    await this.usersService.deleteAccount(user.id);
  }

  @Post('daily-bonus')
  dailyBonus(@CurrentUser() user: User) {
    return this.usersService.claimDailyBonus(user.id);
  }

  @Post(':id/block')
  @HttpCode(204)
  async blockUser(@CurrentUser() user: User, @Param('id') id: string) {
    await this.usersService.blockUser(user.id, id);
  }

  @Delete(':id/block')
  @HttpCode(204)
  async unblockUser(@CurrentUser() user: User, @Param('id') id: string) {
    await this.usersService.unblockUser(user.id, id);
  }

  @Post(':id/report')
  @HttpCode(204)
  async reportUser(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: ReportDto) {
    await this.usersService.reportUser(user.id, id, dto.reason);
  }

  // Admin endpoints
  @Post(':id/verify')
  @HttpCode(204)
  async setVerified(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: AdminActionDto) {
    await this.usersService.setVerified(user.id, id, dto.value ?? true);
  }

  @Post(':id/premium')
  @HttpCode(204)
  async setPremium(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: AdminActionDto) {
    await this.usersService.setPremium(user.id, id, dto.value ?? true, dto.days ?? 30);
  }
}
