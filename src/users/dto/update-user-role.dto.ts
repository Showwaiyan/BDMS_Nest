import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role for the user',
    enum: ['USER', 'STAFF', 'ADMIN'],
    example: 'ADMIN',
  })
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(['USER', 'STAFF', 'ADMIN'], {
    message: 'Role must be one of: USER, STAFF, ADMIN',
  })
  role: 'USER' | 'STAFF' | 'ADMIN';
}
