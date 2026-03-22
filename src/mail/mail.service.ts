import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { AppConfigService } from '../config/config.helper';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(private appConfig: AppConfigService) {
    if (this.appConfig.resendApiKey) {
      this.resend = new Resend(this.appConfig.resendApiKey);
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not set. Emails will not be sent.',
      );
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    if (!this.resend) return;

    try {
      await this.resend.emails.send({
        from: this.appConfig.resendFromEmail,
        to: email,
        subject: 'Welcome to Blood Donation Management System',
        html: `
          <h1>Welcome, ${name}!</h1>
          <p>Thank you for joining our community. We are excited to have you on board!</p>
          <p>You can now start donating or requesting blood to save lives.</p>
        `,
      });
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
    }
  }

  async sendVerificationEmail(email: string, name: string, verificationLink: string) {
    if (!this.resend) return;

    try {
      await this.resend.emails.send({
        from: this.appConfig.resendFromEmail,
        to: email,
        subject: 'Verify Your Email - Blood Donation Management System',
        html: `
          <h1>Hello, ${name}</h1>
          <p>Thank you for registering! Please click the link below to verify your email address:</p>
          <a href="${verificationLink}" style="padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
          <p>This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
    }
  }

  async sendPasswordResetEmail(email: string, name: string, resetLink: string) {
    if (!this.resend) return;

    try {
      await this.resend.emails.send({
        from: this.appConfig.resendFromEmail,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h1>Hello, ${name}</h1>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <a href="${resetLink}" style="padding: 10px 20px; background-color: #e11d48; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        `,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
    }
  }
}
