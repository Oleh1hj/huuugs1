import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { IsOptional, IsString, MaxLength, IsDateString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(50) name?: string;
  @IsOptional() @IsDateString() birth?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @IsOptional() @IsString() photo?: string;
  @IsOptional() @IsIn(['male', 'female']) gender?: string;
  @IsOptional() @IsString() @MaxLength(100) language?: string;
  @IsOptional() @IsIn(['male', 'female', 'any']) lookingForGender?: string;
  @IsOptional() @IsString() @MaxLength(100) lookingForCity?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(18) @Max(100) lookingForAgeMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(18) @Max(100) lookingForAgeMax?: number;
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

  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }
}
