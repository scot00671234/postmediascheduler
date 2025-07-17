import nodemailer from 'nodemailer';
import handlebars from 'handlebars';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Check if email configuration is available
    const emailConfig = this.getEmailConfig();
    if (!emailConfig) {
      console.warn('Email service not configured. Email features will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter(emailConfig);
      this.isConfigured = true;
      console.log('Email service configured successfully');
    } catch (error) {
      console.error('Failed to configure email service:', error);
    }
  }

  private getEmailConfig(): EmailConfig | null {
    // Check for custom SMTP configuration (primary)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };
    }

    // Check for Gmail configuration (fallback)
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      return {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      };
    }

    // Check for SendGrid configuration (fallback)
    if (process.env.SENDGRID_API_KEY) {
      return {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      };
    }

    return null;
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('Email service not configured. Skipping email send.');
      console.log('Email would have been sent to:', to);
      console.log('Subject:', subject);
      console.log('HTML:', html);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@crosspostpro.com',
        to,
        subject,
        html,
      });

      console.log('Email sent successfully:', info.messageId);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    
    const template = handlebars.compile(`
      <h2>Verify Your Email Address</h2>
      <p>Thank you for signing up for CrossPost Pro! Please verify your email address to complete your registration.</p>
      <p><a href="{{verifyUrl}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>{{verifyUrl}}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create this account, please ignore this email.</p>
    `);

    const html = template({ verifyUrl });
    await this.sendEmail(to, 'Verify Your Email - CrossPost Pro', html);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    
    const template = handlebars.compile(`
      <h2>Reset Your Password</h2>
      <p>You requested to reset your password for CrossPost Pro.</p>
      <p><a href="{{resetUrl}}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>{{resetUrl}}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
    `);

    const html = template({ resetUrl });
    await this.sendEmail(to, 'Reset Your Password - CrossPost Pro', html);
  }

  async sendWelcomeEmail(to: string, firstName?: string): Promise<void> {
    const template = handlebars.compile(`
      <h2>Welcome to CrossPost Pro!</h2>
      <p>Hi {{firstName}},</p>
      <p>Welcome to CrossPost Pro! We're excited to have you on board.</p>
      <p>You can now start connecting your social media accounts and scheduling posts across platforms.</p>
      <p><a href="{{dashboardUrl}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Happy posting!</p>
      <p>The CrossPost Pro Team</p>
    `);

    const html = template({ 
      firstName: firstName || 'there',
      dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard`
    });
    
    await this.sendEmail(to, 'Welcome to CrossPost Pro!', html);
  }

  async sendSubscriptionConfirmation(to: string, planName: string, firstName?: string): Promise<void> {
    const template = handlebars.compile(`
      <h2>Subscription Confirmed!</h2>
      <p>Hi {{firstName}},</p>
      <p>Your subscription to the {{planName}} plan has been confirmed.</p>
      <p>You now have access to all premium features including:</p>
      <ul>
        <li>Unlimited posts and scheduling</li>
        <li>Advanced analytics</li>
        <li>Priority support</li>
        <li>Custom scheduling options</li>
      </ul>
      <p><a href="{{dashboardUrl}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
      <p>Thank you for choosing CrossPost Pro!</p>
      <p>The CrossPost Pro Team</p>
    `);

    const html = template({ 
      firstName: firstName || 'there',
      planName,
      dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard`
    });
    
    await this.sendEmail(to, 'Subscription Confirmed - CrossPost Pro', html);
  }

  // Test email configuration
  async testConfiguration(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();