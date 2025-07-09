import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { oauthService } from "./services/oauth";
import { queueService } from "./services/queue";
import { schedulerService } from "./services/scheduler";
import { platformService } from "./services/platforms";
import { z } from "zod";
import { insertPostSchema, insertUserSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import session from "express-session";
import { nanoid } from "nanoid";


// Middleware for authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Initialize default platforms
const initializePlatforms = async () => {
  const defaultPlatforms = [
    { name: "twitter", displayName: "Twitter", icon: "fab fa-twitter", color: "#1DA1F2", isActive: true },
    { name: "instagram", displayName: "Instagram", icon: "fab fa-instagram", color: "#E4405F", isActive: true },
    { name: "linkedin", displayName: "LinkedIn", icon: "fab fa-linkedin", color: "#0077B5", isActive: true },
    { name: "facebook", displayName: "Facebook", icon: "fab fa-facebook", color: "#1877F2", isActive: true },
    { name: "tiktok", displayName: "TikTok", icon: "fab fa-tiktok", color: "#000000", isActive: true },
    { name: "youtube", displayName: "YouTube", icon: "fab fa-youtube", color: "#FF0000", isActive: true },
    { name: "bluesky", displayName: "Bluesky", icon: "fas fa-cloud", color: "#00A8E8", isActive: true },
    { name: "threads", displayName: "Threads", icon: "fab fa-threads", color: "#000000", isActive: true },
    { name: "pinterest", displayName: "Pinterest", icon: "fab fa-pinterest", color: "#E60023", isActive: true },
  ];

  for (const platform of defaultPlatforms) {
    const existing = await storage.getPlatformByName(platform.name);
    if (!existing) {
      await storage.createPlatform(platform);
    }
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Initialize platforms
  await initializePlatforms();

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = user.id;
      
      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserWithConnections(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          platformConnections: user.platformConnections 
        } 
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get user" });
    }
  });

  // Platform routes
  app.get("/api/platforms", async (req, res) => {
    try {
      const platforms = await storage.getPlatforms();
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get platforms" });
    }
  });

  app.get("/api/platforms/:platform/limits", (req, res) => {
    const { platform } = req.params;
    const limits = platformService.getLimits(platform);
    
    if (!limits) {
      return res.status(404).json({ error: "Platform not found" });
    }
    
    res.json(limits);
  });

  // OAuth routes
  app.get("/api/oauth/connect/:platform", requireAuth, async (req, res) => {
    try {
      const { platform } = req.params;
      const authUrl = oauthService.getAuthUrl(platform, req.session.userId!);
      res.json({ authUrl });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "OAuth connection failed" });
    }
  });

  app.get("/api/oauth/callback/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({ error: "Missing authorization code or state" });
      }

      const result = await oauthService.handleCallback(platform, code as string, state as string);
      
      // Get or create platform record
      const platformRecord = await storage.getPlatformByName(platform);
      if (!platformRecord) {
        return res.status(400).json({ error: "Platform not found" });
      }

      // Check if connection already exists
      const existingConnection = await storage.getUserPlatformConnection(result.userId, platformRecord.id);
      
      if (existingConnection) {
        // Update existing connection
        await storage.updateUserPlatformConnection(existingConnection.id, {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          tokenExpiry: result.expiresAt,
          platformUsername: result.userInfo.username || result.userInfo.name,
          isActive: true,
        });
      } else {
        // Create new connection
        await storage.createUserPlatformConnection({
          userId: result.userId,
          platformId: platformRecord.id,
          platformUserId: result.userInfo.id,
          platformUsername: result.userInfo.username || result.userInfo.name,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          tokenExpiry: result.expiresAt,
          isActive: true,
        });
      }

      res.redirect("/?connected=true");
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/?error=oauth_failed");
    }
  });

  // Connection management routes
  app.get("/api/connections", requireAuth, async (req, res) => {
    try {
      const connections = await storage.getUserPlatformConnections(req.session.userId!);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get connections" });
    }
  });

  app.delete("/api/connections/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUserPlatformConnection(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete connection" });
    }
  });

  // Post routes
  app.post("/api/publish", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        content: z.string().min(1),
        platforms: z.array(z.string()).min(1),
        mediaUrls: z.array(z.string()).optional(),
        scheduledAt: z.string().optional(),
      });

      const { content, platforms, mediaUrls, scheduledAt } = schema.parse(req.body);
      
      // Create post record
      const post = await storage.createPost({
        userId: req.session.userId!,
        content,
        mediaUrls,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        status: scheduledAt ? "scheduled" : "publishing",
      });

      // Create post platform records
      for (const platformName of platforms) {
        const platform = await storage.getPlatformByName(platformName);
        if (platform) {
          await storage.createPostPlatform({
            postId: post.id,
            platformId: platform.id,
            status: "pending",
          });
        }
      }

      // Queue the job
      const jobId = scheduledAt 
        ? await schedulerService.schedulePost(
            post.id,
            req.session.userId!,
            platforms,
            { text: content, images: mediaUrls },
            new Date(scheduledAt)
          )
        : await queueService.addPublishJob({
            postId: post.id,
            userId: req.session.userId!,
            platforms,
            content: { text: content, images: mediaUrls },
          });

      res.json({ postId: post.id, jobId });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Publish failed" });
    }
  });

  app.get("/api/status/:jobId", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const status = await queueService.getJobStatus(jobId);
      res.json(status);
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : "Job not found" });
    }
  });

  app.get("/api/posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getUserPosts(req.session.userId!, 20);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get posts" });
    }
  });

  app.get("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.getPostWithPlatforms(parseInt(id));
      
      if (!post || post.userId !== req.session.userId) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get post" });
    }
  });

  app.delete("/api/posts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const post = await storage.getPost(parseInt(id));
      
      if (!post || post.userId !== req.session.userId) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      await storage.deletePost(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete post" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.session.userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
