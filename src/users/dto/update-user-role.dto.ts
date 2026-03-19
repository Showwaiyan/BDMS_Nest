import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserRoleDto {
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(['USER', 'STAFF', 'ADMIN'], {
    message: 'Role must be one of: USER, STAFF, ADMIN',
  })
  role: 'USER' | 'STAFF' | 'ADMIN';
}
