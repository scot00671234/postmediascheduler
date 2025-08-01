import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enhanced users table with boilerplate authentication features
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  
  // Profile information
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  
  // Email verification
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  
  // Password reset functionality
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  
  // Stripe integration
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("free"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const userPlatformConnections = pgTable("user_platform_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  platformId: integer("platform_id").references(() => platforms.id, { onDelete: "cascade" }).notNull(),
  platformUserId: text("platform_user_id").notNull(),
  platformUsername: text("platform_username").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  isActive: boolean("is_active").default(true).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  mediaFileIds: integer("media_file_ids").array(),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  status: text("status").notNull().default("draft"), // draft, scheduled, publishing, published, failed
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const postPlatforms = pgTable("post_platforms", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  platformId: integer("platform_id").references(() => platforms.id, { onDelete: "cascade" }).notNull(),
  platformPostId: text("platform_post_id"),
  status: text("status").notNull().default("pending"), // pending, publishing, published, failed
  customContent: text("custom_content"),
  errorMessage: text("error_message"),
  publishedAt: timestamp("published_at"),
  retryCount: integer("retry_count").default(0).notNull(),
  nextRetryAt: timestamp("next_retry_at"),
  metadata: jsonb("metadata"),
});

export const jobQueue = pgTable("job_queue", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").notNull().unique(),
  type: text("type").notNull(), // publish_post, retry_post
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  priority: integer("priority").default(0).notNull(),
  scheduledAt: timestamp("scheduled_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0).notNull(),
  maxRetries: integer("max_retries").default(3).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  platformConnections: many(userPlatformConnections),
  posts: many(posts),
  mediaFiles: many(mediaFiles),
}));

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
  user: one(users, { fields: [mediaFiles.userId], references: [users.id] }),
}));

export const platformsRelations = relations(platforms, ({ many }) => ({
  userConnections: many(userPlatformConnections),
  postPlatforms: many(postPlatforms),
}));

export const userPlatformConnectionsRelations = relations(userPlatformConnections, ({ one }) => ({
  user: one(users, { fields: [userPlatformConnections.userId], references: [users.id] }),
  platform: one(platforms, { fields: [userPlatformConnections.platformId], references: [platforms.id] }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  platforms: many(postPlatforms),
}));

export const postPlatformsRelations = relations(postPlatforms, ({ one }) => ({
  post: one(posts, { fields: [postPlatforms.postId], references: [posts.id] }),
  platform: one(platforms, { fields: [postPlatforms.platformId], references: [platforms.id] }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  isEmailVerified: true, 
  emailVerificationToken: true, 
  emailVerificationExpiry: true,
  passwordResetToken: true,
  passwordResetExpiry: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  subscriptionEndsAt: true
});
export const insertPlatformSchema = createInsertSchema(platforms).omit({ id: true });
export const insertUserPlatformConnectionSchema = createInsertSchema(userPlatformConnections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPostPlatformSchema = createInsertSchema(postPlatforms).omit({ id: true });
export const insertJobQueueSchema = createInsertSchema(jobQueue).omit({ id: true, createdAt: true });
export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type UserPlatformConnection = typeof userPlatformConnections.$inferSelect;
export type InsertUserPlatformConnection = z.infer<typeof insertUserPlatformConnectionSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type PostPlatform = typeof postPlatforms.$inferSelect;
export type InsertPostPlatform = z.infer<typeof insertPostPlatformSchema>;
export type JobQueue = typeof jobQueue.$inferSelect;
export type InsertJobQueue = z.infer<typeof insertJobQueueSchema>;
export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;

// Extended types for API responses
export type PostWithPlatforms = Post & {
  platforms: (PostPlatform & { platform: Platform })[];
};

export type UserWithConnections = User & {
  platformConnections: (UserPlatformConnection & { platform: Platform })[];
};

export type PlatformStats = {
  totalPosts: number;
  successfulPosts: number;
  failedPosts: number;
  successRate: number;
};

export type DashboardStats = {
  postsThisWeek: number;
  connectedPlatforms: number;
  scheduledPosts: number;
  successRate: string;
};
