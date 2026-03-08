import {
  IsEmail, IsString, MinLength, IsDateString, MaxLength,
  IsIn, IsOptional, IsInt, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsDateString()
  birth: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @IsIn(['male', 'female'])
  gender: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  language: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsIn(['male', 'female', 'any'])
  lookingForGender: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lookingForCity?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18)
  @Max(100)
  lookingForAgeMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(18)
  @Max(100)
  lookingForAgeMax?: number;
}
