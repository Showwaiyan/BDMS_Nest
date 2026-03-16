import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from 'src/auth/decorators/roles.decortor';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import * as requestedUserInterface from 'src/common/interfaces/requested-user.interface';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // all roles: scoped to their own hospital
  @Permissions('user.access')
  @Get()
  findAll(
    @CurrentUser() user: requestedUserInterface.RequestedUser,
    @Query() dto: PaginationDto,
  ) {
    if (!user.hospital_id) {
      throw new ForbiddenException('You are not assigned to any hospital');
    }
    return this.usersService.findAllPatients(dto, user.hospital_id);
  }

  // get own profile
  @Get('me')
  getMe(@CurrentUser() user: requestedUserInterface.RequestedUser) {
    return this.usersService.findOne(user.id);
  }

  // admin only: list all STAFF in their hospital
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('user.access')
  @Get('staff')
  findStaff(
    @CurrentUser() user: requestedUserInterface.RequestedUser,
    @Query() dto: PaginationDto,
  ) {
    if (!user.hospital_id) {
      throw new ForbiddenException('You are not assigned to any hospital');
    }
    return this.usersService.findStaffByHospital(user.hospital_id, dto);
  }

  // admin only
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('user.view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // update own profile
  // @Patch('me')
  // updateMe(
  //   @CurrentUser() user: requestedUserInterface.RequestedUser,
  //   @Body() dto: UpdateUserDto,
  // ) {
  //   return this.usersService.update(user.id, dto);
  // }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('role.update')
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body('role') dto: UpdateUserRoleDto) {
    return this.usersService.updateUserRole(id, dto.role);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('user.update')
  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('user.delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
