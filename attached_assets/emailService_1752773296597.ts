import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

const getEmailConfig = (): EmailConfig => {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };
};

const createTransporter = () => {
  const config = getEmailConfig();
  return nodemailer.createTransport(config);
};

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html: html || text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  const subject = 'Welcome to QR Pro!';
  const text = `
    Hi ${name},
    
    Welcome to QR Pro! Your account has been created successfully.
    
    You can start by creating your first QR code. Free accounts can create 1 QR code, 
    and Pro accounts ($15/month) get unlimited QR codes with advanced customization features.
    
    Best regards,
    The QR Pro Team
  `;
  
  await sendEmail(to, subject, text);
};

export const sendPasswordResetEmail = async (to: string, resetToken: string): Promise<void> => {
  // Use production domain for Railway deployment, fallback to localhost for development
  const baseUrl = process.env.RAILWAY_STATIC_URL 
    ? `https://${process.env.RAILWAY_STATIC_URL}` 
    : process.env.BASE_URL || 'http://localhost:5000';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const subject = 'Reset Your QR Pro Password';
  const text = `Hi,

You requested a password reset for your QR Pro account.

Click the link below to reset your password:
${resetUrl}

If you didn't request this, please ignore this email.

Best regards,
The QR Pro Team`;
  
  await sendEmail(to, subject, text);
};

export const sendSubscriptionConfirmationEmail = async (
  to: string, 
  name: string, 
  amount: number
): Promise<void> => {
  const subject = 'QR Pro Subscription Confirmed';
  const text = `
    Hi ${name},
    
    Your QR Pro subscription has been confirmed!
    
    Plan: Pro Monthly
    Amount: $${(amount / 100).toFixed(2)}
    
    You now have access to:
    - Unlimited QR code generation
    - Full customization options
    - Cloud storage for all your QR codes
    - Priority support
    
    Best regards,
    The QR Pro Team
  `;
  
  await sendEmail(to, subject, text);
};

export const sendSubscriptionCancelationEmail = async (
  to: string, 
  name: string, 
  endDate: Date
): Promise<void> => {
  const subject = 'QR Pro Subscription Canceled';
  const text = `
    Hi ${name},
    
    Your QR Pro subscription has been canceled as requested.
    
    Your Pro features will remain active until ${endDate.toLocaleDateString()}.
    After this date, your account will revert to the free plan.
    
    You can reactivate your subscription at any time from your account settings.
    
    Best regards,
    The QR Pro Team
  `;
  
  await sendEmail(to, subject, text);
};
