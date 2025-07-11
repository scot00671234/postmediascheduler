import { storage } from "../storage";

export interface PlatformLimits {
  platform: string;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  maxRequestsPerUser: number;
  costPerRequest?: number; // in cents
}

export class RateLimiter {
  private platformLimits: Map<string, PlatformLimits> = new Map();
  private usage: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.initializeLimits();
  }

  private initializeLimits() {
    // Twitter API v2 limits
    this.platformLimits.set("twitter", {
      platform: "twitter",
      maxRequestsPerHour: 300,
      maxRequestsPerDay: 1500,
      maxRequestsPerUser: 25,
      costPerRequest: 0 // Free tier
    });

    // Instagram Basic Display limits
    this.platformLimits.set("instagram", {
      platform: "instagram",
      maxRequestsPerHour: 200,
      maxRequestsPerDay: 4800,
      maxRequestsPerUser: 50,
      costPerRequest: 0
    });

    // LinkedIn API limits
    this.platformLimits.set("linkedin", {
      platform: "linkedin",
      maxRequestsPerHour: 100,
      maxRequestsPerDay: 500,
      maxRequestsPerUser: 10,
      costPerRequest: 0
    });

    // Facebook/Meta API limits
    this.platformLimits.set("facebook", {
      platform: "facebook",
      maxRequestsPerHour: 200,
      maxRequestsPerDay: 2000,
      maxRequestsPerUser: 20,
      costPerRequest: 0
    });
  }

  async checkRateLimit(platform: string, userId: number): Promise<{
    allowed: boolean;
    remainingRequests: number;
    resetTime: number;
    estimatedCost: number;
  }> {
    const limits = this.platformLimits.get(platform);
    if (!limits) {
      return { allowed: false, remainingRequests: 0, resetTime: 0, estimatedCost: 0 };
    }

    const now = Date.now();
    const hourKey = `${platform}:${Math.floor(now / (1000 * 60 * 60))}`;
    const userKey = `${platform}:${userId}:${Math.floor(now / (1000 * 60 * 60))}`;

    // Check global platform limits
    const globalUsage = this.usage.get(hourKey) || { count: 0, resetTime: now + (60 * 60 * 1000) };
    const userUsage = this.usage.get(userKey) || { count: 0, resetTime: now + (60 * 60 * 1000) };

    const allowed = 
      globalUsage.count < limits.maxRequestsPerHour &&
      userUsage.count < limits.maxRequestsPerUser;

    const remainingRequests = Math.min(
      limits.maxRequestsPerHour - globalUsage.count,
      limits.maxRequestsPerUser - userUsage.count
    );

    const estimatedCost = (limits.costPerRequest || 0) * 100; // Convert to cents

    return {
      allowed,
      remainingRequests,
      resetTime: globalUsage.resetTime,
      estimatedCost
    };
  }

  async recordUsage(platform: string, userId: number): Promise<void> {
    const now = Date.now();
    const hourKey = `${platform}:${Math.floor(now / (1000 * 60 * 60))}`;
    const userKey = `${platform}:${userId}:${Math.floor(now / (1000 * 60 * 60))}`;

    // Update global usage
    const globalUsage = this.usage.get(hourKey) || { count: 0, resetTime: now + (60 * 60 * 1000) };
    globalUsage.count++;
    this.usage.set(hourKey, globalUsage);

    // Update user usage
    const userUsage = this.usage.get(userKey) || { count: 0, resetTime: now + (60 * 60 * 1000) };
    userUsage.count++;
    this.usage.set(userKey, userUsage);

    // Clean up old entries
    this.cleanup();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, usage] of this.usage.entries()) {
      if (usage.resetTime < now) {
        this.usage.delete(key);
      }
    }
  }

  async getUsageStats(platform: string): Promise<{
    totalRequests: number;
    activeUsers: number;
    estimatedMonthlyCost: number;
  }> {
    const now = Date.now();
    const hourKey = `${platform}:${Math.floor(now / (1000 * 60 * 60))}`;
    const globalUsage = this.usage.get(hourKey) || { count: 0, resetTime: 0 };
    
    const limits = this.platformLimits.get(platform);
    const costPerRequest = limits?.costPerRequest || 0;
    
    // Count active users in the last hour
    const activeUsers = Array.from(this.usage.keys())
      .filter(key => key.startsWith(platform) && key.includes(':'))
      .length;

    const estimatedMonthlyCost = globalUsage.count * costPerRequest * 24 * 30; // Rough estimate

    return {
      totalRequests: globalUsage.count,
      activeUsers,
      estimatedMonthlyCost
    };
  }
}

export const rateLimiter = new RateLimiter();