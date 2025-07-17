import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { nanoid } from 'nanoid';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { storage } from './storage';
import { emailService } from './emailService';
import type { User } from '@shared/schema';

const SALT_ROUNDS = 12;

// Validation schemas
export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const emailVerificationSchema = z.object({
  token: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

// Authentication service
export class AuthService {
  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate token
  generateToken(): string {
    return nanoid(64);
  }

  // Register user
  async register(userData: z.infer<typeof registerSchema>): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password);

    // Generate email verification token
    const emailToken = this.generateToken();
    const emailExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await storage.createUser({
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isEmailVerified: false,
      emailVerificationToken: emailToken,
      emailVerificationExpiry: emailExpiry,
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, emailToken);

    return { user, token: emailToken };
  }

  // Login user
  async login(credentials: z.infer<typeof loginSchema>): Promise<User> {
    const user = await storage.getUserByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await this.verifyPassword(credentials.password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  // Verify email
  async verifyEmail(token: string): Promise<User> {
    const user = await storage.getUserByEmailVerificationToken(token);
    if (!user) {
      throw new Error('Invalid or expired token');
    }

    if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
      throw new Error('Token expired');
    }

    // Update user
    await storage.updateUser(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    });

    return await storage.getUser(user.id) as User;
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal that email doesn't exist
      return;
    }

    const resetToken = this.generateToken();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await storage.updatePasswordResetToken(user.id, resetToken, resetExpiry);
    await emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await storage.getUserByResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired token');
    }

    if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) {
      throw new Error('Token expired');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await storage.updatePassword(user.id, hashedPassword);

    return await storage.getUser(user.id) as User;
  }

  // Get current user from session
  async getCurrentUser(req: Request): Promise<User | null> {
    const userId = req.session.userId;
    if (!userId) {
      return null;
    }

    return await storage.getUser(userId) || null;
  }
}

// Authentication middleware
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Optional authentication middleware
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getCurrentUser(req);
    req.user = user;
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

// Email verification middleware
export const requireEmailVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ error: 'Email verification required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Email verification middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export singleton instance
export const authService = new AuthService();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User | null;
    }
    interface Session {
      userId?: number;
    }
  }
}