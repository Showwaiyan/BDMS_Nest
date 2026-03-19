import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  user_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
