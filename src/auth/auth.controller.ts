import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/logint.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import {
  AuthUserLoginResponseDataDto,
  AuthRegisterResponseDataDto,
  AuthTokenResponseDataDto,
  AuthUserProfileResponseDataDto,
  MessageResponseDto,
} from './dto/auth-responses.dto';
import * as requestedUserInterface from 'src/common/interfaces/requested-user.interface';

@ApiTags('auth')
@ApiExtraModels(
  ApiResponseDto,
  AuthUserLoginResponseDataDto,
  AuthRegisterResponseDataDto,
  AuthTokenResponseDataDto,
  AuthUserProfileResponseDataDto,
  MessageResponseDto,
)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 201 },
        message: { example: 'User registered successfully' },
        data: { $ref: getSchemaPath(AuthRegisterResponseDataDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Verify user email using a token' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Email verified successfully' },
        data: { $ref: getSchemaPath(MessageResponseDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiResponse({
    status: 200,
    description: 'Verification link sent if account exists',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Verification link sent successfully' },
        data: { $ref: getSchemaPath(MessageResponseDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email, dto.hospital_id);
  }

  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if user exists',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Password reset email sent successfully' },
        data: { $ref: getSchemaPath(MessageResponseDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Reset password using a token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Password reset successfully' },
        data: { $ref: getSchemaPath(MessageResponseDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Login successful' },
        data: { $ref: getSchemaPath(AuthUserLoginResponseDataDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({
    summary: 'Initiate Google OAuth login (must provide hospital_id in query)',
  })
  @UseGuards(GoogleOauthGuard)
  @Get('google')
  googleAuth(@Query('hospital_id') hospital_id: string) {
    // Initiates the Google OAuth flow
  }

  @ApiOperation({ summary: 'Google OAuth callback' })
  @UseGuards(GoogleOauthGuard)
  @Get('google/callback')
  googleAuthRedirect(@Req() req: Request) {
    // The google strategy populates req.user
    const user = req.user as {
      providerId: string;
      email: string;
      provider: string;
      hospital_id: string; // Extracted from state by strategy
    };
    return this.authService.validateOAuthLogin(user, user.hospital_id);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Token refreshed successfully' },
        data: { $ref: getSchemaPath(AuthTokenResponseDataDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@CurrentUser() user: requestedUserInterface.RequestedUser) {
    return this.authService.refreshToken(user.id);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Request successful' },
        data: { $ref: getSchemaPath(AuthUserProfileResponseDataDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: requestedUserInterface.RequestedUser) {
    return this.authService.getMe(user.id);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Password updated successfully' },
        data: { $ref: getSchemaPath(MessageResponseDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid password' })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  @UseGuards(JwtAuthGuard)
  @Post('update-password')
  updatePassword(
    @CurrentUser() user: requestedUserInterface.RequestedUser,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.authService.updatePassword(user.id, dto);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout and revoke tokens' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      properties: {
        success: { example: true },
        statusCode: { example: 200 },
        message: { example: 'Logged out successfully' },
        data: { $ref: getSchemaPath(MessageResponseDto) },
        timestamp: { example: '2026-03-22T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Body() dto: LogoutDto) {
    // JwtAuthGuard already validated the token, so it's guaranteed to exist
    const accessToken = req.headers.authorization!.substring(7); // Remove "Bearer " prefix

    const decoded = this.jwtService.decode<{ exp?: number }>(accessToken);
    if (decoded?.exp) {
      return await this.authService.logout(
        accessToken,
        decoded.exp,
        dto.refreshToken,
      );
    }

    return { message: 'Logged out successfully' };
  }
}
