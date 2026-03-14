import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
  // Contact filters
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

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.findPublicById(id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('daily-bonus')
  dailyBonus(@CurrentUser() user: User) {
    return this.usersService.claimDailyBonus(user.id);
  }
}
