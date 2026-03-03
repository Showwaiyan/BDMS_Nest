import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
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

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // admin only
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('user.manage')
  @Get()
  findAll(@Query() dto: PaginationDto) {
    return this.usersService.findAll(dto);
  }

  // get own profile
  @Get('me')
  getMe(@CurrentUser() user: requestedUserInterface.RequestedUser) {
    return this.usersService.findOne(user.id);
  }

  // admin only
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('user.manage')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // update own profile
  @Patch('me')
  updateMe(
    @CurrentUser() user: requestedUserInterface.RequestedUser,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, dto);
  }

  // admin only
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('user.manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // admin only
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('user.manage')
  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  // admin only
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Permissions('user.manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
