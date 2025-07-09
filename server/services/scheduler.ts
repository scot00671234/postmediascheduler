import { storage } from "../storage";
import { queueService } from "./queue";

export class SchedulerService {
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startScheduler();
  }

  private startScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    // Check for scheduled posts every minute
    this.schedulerInterval = setInterval(() => {
      this.processScheduledPosts();
    }, 60 * 1000);
  }

  private async processScheduledPosts(): Promise<void> {
    try {
      const now = new Date();
      const scheduledPosts = await storage.getScheduledPosts(now);

      for (const post of scheduledPosts) {
        await this.publishScheduledPost(post);
      }
    } catch (error) {
      console.error("Error processing scheduled posts:", error);
    }
  }

  private async publishScheduledPost(post: any): Promise<void> {
    try {
      // Update post status to publishing
      await storage.updatePost(post.id, {
        status: "publishing",
      });

      // Update all platform statuses to publishing
      for (const platform of post.platforms) {
        await storage.updatePostPlatform(platform.id, {
          status: "publishing",
        });
      }

      // Create job for immediate execution
      const jobId = await queueService.addPublishJob({
        postId: post.id,
        userId: post.userId,
        platforms: post.platforms.map((p: any) => p.platform.name),
        content: {
          text: post.content,
          images: post.mediaUrls || [],
          videos: [],
        },
      });

      console.log(`Scheduled post ${post.id} queued for publishing with job ${jobId}`);
    } catch (error) {
      console.error(`Failed to publish scheduled post ${post.id}:`, error);
      
      // Mark post as failed
      await storage.updatePost(post.id, {
        status: "failed",
      });
    }
  }

  async schedulePost(
    postId: number,
    userId: number,
    platforms: string[],
    content: { text: string; images?: string[]; videos?: string[] },
    scheduledAt: Date
  ): Promise<string> {
    // Create job for scheduled execution
    const jobId = await queueService.addPublishJob({
      postId,
      userId,
      platforms,
      content,
    }, scheduledAt);

    return jobId;
  }

  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }
}

export const schedulerService = new SchedulerService();
