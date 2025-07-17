import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Middleware to check if user has active Pro subscription
export const requireProSubscription = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check if user has active subscription
    const hasActiveSubscription = user.subscriptionStatus === 'active' || 
                                 user.subscriptionStatus === 'trialing' || 
                                 (user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > new Date());
    
    if (!hasActiveSubscription) {
      return res.status(403).json({ 
        error: 'Pro subscription required',
        message: 'This feature requires an active Pro subscription. Please upgrade your account.',
        upgradeUrl: '/subscribe'
      });
    }
    
    next();
  } catch (error) {
    console.error('Pro subscription check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check subscription status utility
export const checkSubscriptionStatus = (user: any) => {
  if (!user) return 'free';
  
  const now = new Date();
  const subscriptionEndsAt = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;
  
  if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
    return user.subscriptionStatus;
  }
  
  if (subscriptionEndsAt && subscriptionEndsAt > now) {
    return 'active';
  }
  
  return 'free';
};

// Pro feature limits
export const PRO_LIMITS = {
  FREE_TIER: {
    maxPosts: 10,
    maxConnections: 2,
    maxScheduledPosts: 5,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  PRO_TIER: {
    maxPosts: 1000,
    maxConnections: 10,
    maxScheduledPosts: 100,
    maxFileSize: 100 * 1024 * 1024, // 100MB
  }
};

// Check feature limits
export const checkFeatureLimits = async (userId: number, featureType: string) => {
  const user = await storage.getUser(userId);
  const subscriptionStatus = checkSubscriptionStatus(user);
  
  const limits = subscriptionStatus === 'free' ? PRO_LIMITS.FREE_TIER : PRO_LIMITS.PRO_TIER;
  
  switch (featureType) {
    case 'posts':
      const userPosts = await storage.getUserPosts(userId);
      return userPosts.length < limits.maxPosts;
    
    case 'connections':
      const userConnections = await storage.getUserPlatformConnections(userId);
      return userConnections.length < limits.maxConnections;
    
    case 'scheduledPosts':
      const scheduledPosts = await storage.getScheduledPosts(userId);
      return scheduledPosts.length < limits.maxScheduledPosts;
    
    default:
      return true;
  }
};