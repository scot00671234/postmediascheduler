import { storage } from "../storage";
import { platformService } from "./platforms";
import { rateLimiter } from "./rate-limiter";
import { nanoid } from "nanoid";
import { JobQueue, PostWithPlatforms } from "@shared/schema";

export interface JobPayload {
  postId: number;
  userId: number;
  platforms: string[];
  content: {
    text: string;
    images?: string[];
    videos?: string[];
  };
  retryCount?: number;
}

export class QueueService {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startProcessing();
  }

  async addPublishJob(payload: JobPayload, scheduledAt?: Date): Promise<string> {
    const jobId = nanoid();
    
    // Check rate limits for each platform
    for (const platform of payload.platforms) {
      const rateCheck = await rateLimiter.checkRateLimit(platform, payload.userId);
      if (!rateCheck.allowed) {
        throw new Error(`Rate limit exceeded for ${platform}. Try again in ${Math.ceil((rateCheck.resetTime - Date.now()) / 1000 / 60)} minutes.`);
      }
    }
    
    await storage.createJob({
      jobId,
      type: "publish_post",
      payload: payload as any,
      scheduledAt: scheduledAt || new Date(),
      priority: 0,
      status: "pending",
    });

    return jobId;
  }

  async addRetryJob(payload: JobPayload, retryCount: number): Promise<string> {
    const jobId = nanoid();
    const delay = this.calculateRetryDelay(retryCount);
    const scheduledAt = new Date(Date.now() + delay);
    
    await storage.createJob({
      jobId,
      type: "retry_post",
      payload: { ...payload, retryCount } as any,
      scheduledAt,
      priority: 1, // Higher priority for retries
      status: "pending",
    });

    return jobId;
  }

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: 2^retryCount minutes in milliseconds
    return Math.min(Math.pow(2, retryCount) * 60 * 1000, 60 * 60 * 1000); // Max 1 hour
  }

  private startProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      if (!this.isProcessing) {
        this.processJobs();
      }
    }, 5000); // Check every 5 seconds
  }

  private async processJobs(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    
    try {
      const jobs = await storage.getPendingJobs(5);
      
      for (const job of jobs) {
        if (job.scheduledAt && job.scheduledAt > new Date()) {
          continue; // Skip jobs that aren't ready yet
        }

        await this.processJob(job);
      }
    } catch (error) {
      console.error("Error processing jobs:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJob(job: JobQueue): Promise<void> {
    try {
      // Mark job as processing
      await storage.updateJob(job.id, {
        status: "processing",
        processedAt: new Date(),
      });

      const payload = job.payload as JobPayload;
      
      // Get post details
      const post = await storage.getPostWithPlatforms(payload.postId);
      if (!post) {
        throw new Error(`Post not found: ${payload.postId}`);
      }

      // Get user's platform connections
      const connections = await storage.getUserPlatformConnections(payload.userId);
      
      // Publish to selected platforms
      const results = await platformService.publishToMultiplePlatforms(
        connections,
        payload.content,
        payload.platforms
      );

      // Update post platform statuses
      let hasFailures = false;
      for (const [platformName, result] of results.entries()) {
        const platform = await storage.getPlatformByName(platformName);
        if (!platform) continue;

        const postPlatform = post.platforms.find(p => p.platform.name === platformName);
        if (!postPlatform) continue;

        if (result.success) {
          await storage.updatePostPlatform(postPlatform.id, {
            status: "published",
            platformPostId: result.postId,
            publishedAt: new Date(),
            errorMessage: null,
          });
        } else {
          hasFailures = true;
          await storage.updatePostPlatform(postPlatform.id, {
            status: "failed",
            errorMessage: result.error,
            retryCount: (postPlatform.retryCount || 0) + 1,
          });

          // Schedule retry if within limits
          if ((postPlatform.retryCount || 0) < 3) {
            await this.addRetryJob({
              ...payload,
              platforms: [platformName],
            }, (postPlatform.retryCount || 0) + 1);
          }
        }
      }

      // Update overall post status
      const allPlatforms = post.platforms;
      const publishedCount = allPlatforms.filter(p => p.status === "published").length;
      const failedCount = allPlatforms.filter(p => p.status === "failed").length;
      
      let postStatus = "published";
      if (failedCount > 0 && publishedCount === 0) {
        postStatus = "failed";
      } else if (failedCount > 0) {
        postStatus = "partial"; // Some platforms succeeded
      }

      await storage.updatePost(payload.postId, {
        status: postStatus,
        publishedAt: publishedCount > 0 ? new Date() : null,
      });

      // Mark job as completed
      await storage.updateJob(job.id, {
        status: "completed",
      });

    } catch (error) {
      console.error(`Job ${job.jobId} failed:`, error);
      
      // Mark job as failed
      await storage.updateJob(job.id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      // Schedule retry if within limits
      if (job.retryCount < job.maxRetries) {
        await this.addRetryJob(
          job.payload as JobPayload,
          job.retryCount + 1
        );
      }
    }
  }

  async getJobStatus(jobId: string): Promise<{
    status: string;
    platforms: Array<{
      platform: string;
      status: string;
      postId?: string;
      error?: string;
    }>;
  }> {
    const job = await storage.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const payload = job.payload as JobPayload;
    const post = await storage.getPostWithPlatforms(payload.postId);
    
    if (!post) {
      return {
        status: job.status,
        platforms: [],
      };
    }

    const platforms = post.platforms.map(p => ({
      platform: p.platform.name,
      status: p.status,
      postId: p.platformPostId || undefined,
      error: p.errorMessage || undefined,
    }));

    return {
      status: job.status,
      platforms,
    };
  }

  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
  }
}

export const queueService = new QueueService();
