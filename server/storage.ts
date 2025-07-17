import { 
  users, platforms, userPlatformConnections, posts, postPlatforms, jobQueue, mediaFiles,
  type User, type InsertUser, type Platform, type InsertPlatform,
  type UserPlatformConnection, type InsertUserPlatformConnection,
  type Post, type InsertPost, type PostPlatform, type InsertPostPlatform,
  type JobQueue, type InsertJobQueue, type PostWithPlatforms,
  type UserWithConnections, type DashboardStats, type MediaFile, type InsertMediaFile
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, count, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: Partial<User>): Promise<User>;
  createUser(insertUser: InsertUser): Promise<User>;
  getUserWithConnections(userId: number): Promise<UserWithConnections | undefined>;
  updateUser(id: number, updates: Partial<User>): Promise<void>;
  updateUserStripeInfo(userId: number, customerId: string, subscriptionId?: string): Promise<User>;
  updateUserSubscription(userId: number, status: string, endsAt?: Date): Promise<User>;
  updatePasswordResetToken(userId: number, token: string, expiry: Date): Promise<void>;
  updatePassword(userId: number, hashedPassword: string): Promise<void>;
  deleteUser(userId: number): Promise<void>;
  updateStripeCustomerId(id: number, customerId: string): Promise<User>;

  // Platform methods
  getPlatforms(): Promise<Platform[]>;
  getPlatformByName(name: string): Promise<Platform | undefined>;
  createPlatform(insertPlatform: InsertPlatform): Promise<Platform>;

  // User Platform Connection methods
  getUserPlatformConnections(userId: number): Promise<(UserPlatformConnection & { platform: Platform })[]>;
  getUserPlatformConnection(userId: number, platformId: number): Promise<UserPlatformConnection | undefined>;
  createUserPlatformConnection(insertConnection: InsertUserPlatformConnection): Promise<UserPlatformConnection>;
  updateUserPlatformConnection(id: number, updates: Partial<UserPlatformConnection>): Promise<void>;
  deleteUserPlatformConnection(id: number): Promise<void>;

  // Media File methods
  createMediaFile(insertMediaFile: InsertMediaFile): Promise<MediaFile>;
  getMediaFile(id: number): Promise<MediaFile | undefined>;
  getUserMediaFiles(userId: number): Promise<MediaFile[]>;
  deleteMediaFile(id: number): Promise<void>;

  // Post methods
  createPost(insertPost: InsertPost): Promise<Post>;
  getPost(id: number): Promise<Post | undefined>;
  getPostWithPlatforms(id: number): Promise<PostWithPlatforms | undefined>;
  getUserPosts(userId: number, limit?: number): Promise<PostWithPlatforms[]>;
  updatePost(id: number, updates: Partial<Post>): Promise<void>;
  deletePost(id: number): Promise<void>;
  getScheduledPosts(before: Date): Promise<PostWithPlatforms[]>;

  // Post Platform methods
  createPostPlatform(insertPostPlatform: InsertPostPlatform): Promise<PostPlatform>;
  updatePostPlatform(id: number, updates: Partial<PostPlatform>): Promise<void>;

  // Job Queue methods
  createJob(insertJob: InsertJobQueue): Promise<JobQueue>;
  getJob(jobId: string): Promise<JobQueue | undefined>;
  getPendingJobs(limit: number): Promise<JobQueue[]>;
  updateJob(id: number, updates: Partial<JobQueue>): Promise<void>;

  // Analytics methods
  getDashboardStats(userId: number): Promise<DashboardStats>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: Partial<User>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserWithConnections(userId: number): Promise<UserWithConnections | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const connections = await this.getUserPlatformConnections(userId);
    return {
      ...user,
      platformConnections: connections
    };
  }

  async updateUser(id: number, updates: Partial<User>): Promise<void> {
    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id));
  }

  async updateUserStripeInfo(userId: number, customerId: string, subscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSubscription(userId: number, status: string, endsAt?: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: status,
        subscriptionEndsAt: endsAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updatePasswordResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        passwordResetToken: token, 
        passwordResetExpiry: expiry,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async deleteUser(userId: number): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  async updateStripeCustomerId(id: number, customerId: string): Promise<User> {
    const [user] = await db.update(users).set({
      stripeCustomerId: customerId,
    }).where(eq(users.id, id)).returning();
    return user;
  }

  // Platform methods
  async getPlatforms(): Promise<Platform[]> {
    return await db.select().from(platforms).where(eq(platforms.isActive, true));
  }

  async getPlatformByName(name: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.name, name));
    return platform || undefined;
  }

  async createPlatform(insertPlatform: InsertPlatform): Promise<Platform> {
    const [platform] = await db
      .insert(platforms)
      .values(insertPlatform)
      .returning();
    return platform;
  }

  // User Platform Connection methods
  async getUserPlatformConnections(userId: number): Promise<(UserPlatformConnection & { platform: Platform })[]> {
    return await db
      .select()
      .from(userPlatformConnections)
      .innerJoin(platforms, eq(userPlatformConnections.platformId, platforms.id))
      .where(eq(userPlatformConnections.userId, userId))
      .then(rows => rows.map(row => ({
        ...row.user_platform_connections,
        platform: row.platforms
      })));
  }

  async getUserPlatformConnection(userId: number, platformId: number): Promise<UserPlatformConnection | undefined> {
    const [connection] = await db
      .select()
      .from(userPlatformConnections)
      .where(and(
        eq(userPlatformConnections.userId, userId),
        eq(userPlatformConnections.platformId, platformId)
      ));
    return connection || undefined;
  }

  async createUserPlatformConnection(insertConnection: InsertUserPlatformConnection): Promise<UserPlatformConnection> {
    const [connection] = await db
      .insert(userPlatformConnections)
      .values(insertConnection)
      .returning();
    return connection;
  }

  async updateUserPlatformConnection(id: number, updates: Partial<UserPlatformConnection>): Promise<void> {
    await db
      .update(userPlatformConnections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPlatformConnections.id, id));
  }

  async deleteUserPlatformConnection(id: number): Promise<void> {
    await db
      .delete(userPlatformConnections)
      .where(eq(userPlatformConnections.id, id));
  }

  // Media File methods
  async createMediaFile(insertMediaFile: InsertMediaFile): Promise<MediaFile> {
    const [mediaFile] = await db
      .insert(mediaFiles)
      .values(insertMediaFile)
      .returning();
    return mediaFile;
  }

  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    const [mediaFile] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return mediaFile || undefined;
  }

  async getUserMediaFiles(userId: number): Promise<MediaFile[]> {
    return await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.userId, userId))
      .orderBy(desc(mediaFiles.createdAt));
  }

  async deleteMediaFile(id: number): Promise<void> {
    await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
  }

  // Post methods
  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async getPostWithPlatforms(id: number): Promise<PostWithPlatforms | undefined> {
    const post = await this.getPost(id);
    if (!post) return undefined;

    const platformResults = await db
      .select()
      .from(postPlatforms)
      .innerJoin(platforms, eq(postPlatforms.platformId, platforms.id))
      .where(eq(postPlatforms.postId, id));

    return {
      ...post,
      platforms: platformResults.map(row => ({
        ...row.post_platforms,
        platform: row.platforms
      }))
    };
  }

  async getUserPosts(userId: number, limit = 20): Promise<PostWithPlatforms[]> {
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    const postsWithPlatforms: PostWithPlatforms[] = [];
    
    for (const post of userPosts) {
      const platformResults = await db
        .select()
        .from(postPlatforms)
        .innerJoin(platforms, eq(postPlatforms.platformId, platforms.id))
        .where(eq(postPlatforms.postId, post.id));

      postsWithPlatforms.push({
        ...post,
        platforms: platformResults.map(row => ({
          ...row.post_platforms,
          platform: row.platforms
        }))
      });
    }

    return postsWithPlatforms;
  }

  async updatePost(id: number, updates: Partial<Post>): Promise<void> {
    await db
      .update(posts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posts.id, id));
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async getScheduledPosts(before: Date): Promise<PostWithPlatforms[]> {
    const scheduledPosts = await db
      .select()
      .from(posts)
      .where(and(
        eq(posts.status, "scheduled"),
        lt(posts.scheduledAt, before)
      ));

    const postsWithPlatforms: PostWithPlatforms[] = [];
    
    for (const post of scheduledPosts) {
      const platformResults = await db
        .select()
        .from(postPlatforms)
        .innerJoin(platforms, eq(postPlatforms.platformId, platforms.id))
        .where(eq(postPlatforms.postId, post.id));

      postsWithPlatforms.push({
        ...post,
        platforms: platformResults.map(row => ({
          ...row.post_platforms,
          platform: row.platforms
        }))
      });
    }

    return postsWithPlatforms;
  }

  // Post Platform methods
  async createPostPlatform(insertPostPlatform: InsertPostPlatform): Promise<PostPlatform> {
    const [postPlatform] = await db
      .insert(postPlatforms)
      .values(insertPostPlatform)
      .returning();
    return postPlatform;
  }

  async updatePostPlatform(id: number, updates: Partial<PostPlatform>): Promise<void> {
    await db
      .update(postPlatforms)
      .set(updates)
      .where(eq(postPlatforms.id, id));
  }

  // Job Queue methods
  async createJob(insertJob: InsertJobQueue): Promise<JobQueue> {
    const [job] = await db
      .insert(jobQueue)
      .values(insertJob)
      .returning();
    return job;
  }

  async getJob(jobId: string): Promise<JobQueue | undefined> {
    const [job] = await db.select().from(jobQueue).where(eq(jobQueue.jobId, jobId));
    return job || undefined;
  }

  async getPendingJobs(limit: number): Promise<JobQueue[]> {
    return await db
      .select()
      .from(jobQueue)
      .where(eq(jobQueue.status, "pending"))
      .orderBy(jobQueue.priority, jobQueue.scheduledAt)
      .limit(limit);
  }

  async updateJob(id: number, updates: Partial<JobQueue>): Promise<void> {
    await db
      .update(jobQueue)
      .set(updates)
      .where(eq(jobQueue.id, id));
  }

  // Analytics methods
  async getDashboardStats(userId: number): Promise<DashboardStats> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Posts this week
    const [postsThisWeekResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(
        eq(posts.userId, userId),
        sql`${posts.createdAt} >= ${weekAgo}`
      ));

    // Connected platforms
    const [connectedPlatformsResult] = await db
      .select({ count: count() })
      .from(userPlatformConnections)
      .where(and(
        eq(userPlatformConnections.userId, userId),
        eq(userPlatformConnections.isActive, true)
      ));

    // Scheduled posts
    const [scheduledPostsResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(
        eq(posts.userId, userId),
        eq(posts.status, "scheduled")
      ));

    // Success rate calculation
    const [totalPostsResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.userId, userId));

    const [successfulPostsResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(
        eq(posts.userId, userId),
        eq(posts.status, "published")
      ));

    const totalPosts = totalPostsResult.count;
    const successfulPosts = successfulPostsResult.count;
    const successRate = totalPosts > 0 ? Math.round((successfulPosts / totalPosts) * 100) : 0;

    return {
      postsThisWeek: postsThisWeekResult.count,
      connectedPlatforms: connectedPlatformsResult.count,
      scheduledPosts: scheduledPostsResult.count,
      successRate: `${successRate}%`
    };
  }
}

export const storage = new DatabaseStorage();