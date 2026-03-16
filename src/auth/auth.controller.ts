import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/logint.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as requestedUserInterface from 'src/common/interfaces/requested-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  refresh(@CurrentUser() user: requestedUserInterface.RequestedUser) {
    return this.authService.refreshToken(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: requestedUserInterface.RequestedUser) {
    return this.authService.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-password')
  updatePassword(
    @CurrentUser() user: requestedUserInterface.RequestedUser,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.authService.updatePassword(user.id, dto);
  }
}
