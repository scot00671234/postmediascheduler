import { MailService } from '@sendgrid/mail';

class EmailService {
  private mailService: MailService;
  private fromEmail: string;

  constructor() {
    this.mailService = new MailService();
    this.fromEmail = 'noreply@postmedia.com';
    
    // Set API key if available
    if (process.env.SENDGRID_API_KEY) {
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  async sendVerificationEmail(email: string, username: string, verificationToken: string): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('SendGrid API key not configured. Verification email not sent.');
      return false;
    }

    try {
      const verificationUrl = `${process.env.REPLIT_DEPLOYMENT_URL || 'http://localhost:5000'}/verify-email?token=${verificationToken}`;
      
      const msg = {
        to: email,
        from: this.fromEmail,
        subject: 'Verify your Post Media account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Welcome to Post Media!</h2>
            <p>Hi ${username},</p>
            <p>Thank you for signing up for Post Media. To complete your account setup, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with Post Media, please ignore this email.</p>
            <p>Best regards,<br>The Post Media Team</p>
          </div>
        `,
      };

      await this.mailService.send(msg);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, username: string, resetToken: string): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('SendGrid API key not configured. Password reset email not sent.');
      return false;
    }

    try {
      const resetUrl = `${process.env.REPLIT_DEPLOYMENT_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      const msg = {
        to: email,
        from: this.fromEmail,
        subject: 'Reset your Post Media password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Password Reset Request</h2>
            <p>Hi ${username},</p>
            <p>You recently requested to reset your password for your Post Media account. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Best regards,<br>The Post Media Team</p>
          </div>
        `,
      };

      await this.mailService.send(msg);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();