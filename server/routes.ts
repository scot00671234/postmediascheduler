import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { oauthService } from "./services/oauth";
import { queueService } from "./services/queue";
import { schedulerService } from "./services/scheduler";
import { platformService } from "./services/platforms";
import { emailService } from "./services/email";
import { z } from "zod";
import { insertPostSchema, insertUserSchema, insertMediaFileSchema, users } from "@shared/schema";
import express from "express";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { nanoid } from "nanoid";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import mime from "mime-types";
import Stripe from "stripe";
import { pool } from "./db";


// Middleware for authentication
const requireAuth = (req: any, res: any, next: any) => {
  console.log('Auth check - Session:', req.session?.userId ? 'exists' : 'missing');
  console.log('Auth check - Session ID:', req.sessionID);
  console.log('Auth check - Session data:', req.session);
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Initialize default platforms
const initializePlatforms = async () => {
  const defaultPlatforms = [
    { name: "twitter", displayName: "Twitter/X", icon: "fab fa-twitter", color: "#1DA1F2", isActive: true },
    { name: "linkedin", displayName: "LinkedIn", icon: "fab fa-linkedin", color: "#0077B5", isActive: true },
  ];

  for (const platform of defaultPlatforms) {
    const existing = await storage.getPlatformByName(platform.name);
    if (!existing) {
      await storage.createPlatform(platform);
    }
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session middleware with memory store for debugging
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Disable for development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  }));

  // Initialize platforms
  await initializePlatforms();

  // Initialize Stripe
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-09-30.acacia",
  }) : null;

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file uploads
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const fileExtension = path.extname(file.originalname);
      const filename = `${uuidv4()}${fileExtension}`;
      cb(null, filename);
    }
  });

  const upload = multer({
    storage: multerStorage,
    fileFilter: (req, file, cb) => {
      // Accept images and videos
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image and video files are allowed'));
      }
    },
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));

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

      // Set session and save it explicitly
      req.session.userId = user.id;
      console.log('Register - Setting session userId:', user.id, 'SessionID:', req.sessionID);
      
      req.session.save((err) => {
        if (err) {
          console.error('Register session save error:', err);
          return res.status(500).json({ error: "Session save failed" });
        }
        console.log('Register session saved successfully - UserID:', user.id, 'SessionID:', req.sessionID);
        res.json({ user: { id: user.id, username: user.username, email: user.email } });
      });
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
      console.log('Login - Setting session userId:', user.id, 'SessionID:', req.sessionID);
      
      req.session.save((err) => {
        if (err) {
          console.error('Login session save error:', err);
          return res.status(500).json({ error: "Session save failed" });
        }
        console.log('Login session saved successfully - UserID:', user.id, 'SessionID:', req.sessionID);
        res.json({ user: { id: user.id, username: user.username, email: user.email } });
      });
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

      res.redirect("/dashboard?connected=true");
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/dashboard?error=oauth_failed");
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
        mediaFileIds: mediaUrls ? mediaUrls.map(Number) : [],
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
      
      if (!post || post.userId !== req.session.userId!) {
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
      
      if (!post || post.userId !== req.session.userId!) {
        return res.status(404).json({ error: "Post not found" });
      }
      
      await storage.deletePost(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete post" });
    }
  });

  // File upload routes
  app.post("/api/upload", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = path.join(uploadsDir, req.file.filename);
      let processedPath = filePath;

      // Process images with sharp
      if (req.file.mimetype.startsWith('image/')) {
        const processedFilename = `processed_${req.file.filename}`;
        processedPath = path.join(uploadsDir, processedFilename);
        
        await sharp(filePath)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(processedPath);
          
        // Remove original file
        fs.unlinkSync(filePath);
      }

      // Save file info to database
      const mediaFile = await storage.createMediaFile({
        userId: req.session.userId!,
        filename: path.basename(processedPath),
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${path.basename(processedPath)}`,
      });

      res.json({
        id: mediaFile.id,
        filename: mediaFile.filename,
        originalName: mediaFile.originalName,
        url: mediaFile.url,
        size: mediaFile.size,
        mimeType: mediaFile.mimeType,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Upload failed" });
    }
  });

  app.get("/api/media", requireAuth, async (req, res) => {
    try {
      const mediaFiles = await storage.getUserMediaFiles(req.session.userId!);
      res.json(mediaFiles);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get media files" });
    }
  });

  app.delete("/api/media/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const mediaFile = await storage.getMediaFile(parseInt(id));
      
      if (!mediaFile || mediaFile.userId !== req.session.userId!) {
        return res.status(404).json({ error: "Media file not found" });
      }

      // Delete file from disk
      const filePath = path.join(uploadsDir, mediaFile.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      await storage.deleteMediaFile(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete media file" });
    }
  });

  // Email verification routes
  app.post("/api/auth/send-verification", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ error: "Email already verified" });
      }

      const verificationToken = uuidv4();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.updateUser(userId, {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      });

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(
        user.email,
        user.username,
        verificationToken
      );

      if (emailSent) {
        res.json({ message: "Verification email sent" });
      } else {
        res.json({ 
          message: "Verification email queued",
          verificationToken: verificationToken // For testing when SendGrid is not configured
        });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to send verification email" });
    }
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Verification token required" });
      }

      const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
      
      if (!user) {
        return res.status(400).json({ error: "Invalid verification token" });
      }

      if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
        return res.status(400).json({ error: "Verification token expired" });
      }

      await storage.updateUser(user.id, {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      });

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Email verification failed" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.session.userId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get analytics" });
    }
  });

  // Stripe subscription routes
  app.post("/api/create-subscription", requireAuth, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    try {
      const { planName, amount } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user already has an active subscription
      if (user.stripeSubscriptionId) {
        const existingSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
          return res.status(400).json({ error: "User already has an active subscription" });
        }
      }

      let customerId = user.stripeCustomerId;

      // Create customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: user.id.toString(),
          },
        });
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      }

      // Create or get price based on plan
      let priceId: string;
      const planAmounts = {
        'Creator': 700, // $7.00
      };

      const planAmount = planAmounts[planName as keyof typeof planAmounts];
      if (!planAmount) {
        return res.status(400).json({ error: "Invalid plan name" });
      }

      // Try to find existing product and price
      try {
        const products = await stripe.products.list({
          active: true,
          limit: 100,
        });
        
        let product = products.data.find(p => p.name === `CrossPost Pro - ${planName}`);
        
        if (!product) {
          // Create new product
          product = await stripe.products.create({
            name: `CrossPost Pro - ${planName}`,
            description: `${planName} plan for CrossPost Pro - Multi-platform social media publishing`,
            metadata: {
              planType: planName.toLowerCase(),
              environment: process.env.NODE_ENV || 'development',
            },
          });
        }

        // Look for existing price
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
          type: 'recurring',
        });

        let price = prices.data.find(p => p.unit_amount === planAmount);
        
        if (!price) {
          // Create new price
          price = await stripe.prices.create({
            unit_amount: planAmount,
            currency: 'usd',
            recurring: {
              interval: 'month',
            },
            product: product.id,
            metadata: {
              planType: planName.toLowerCase(),
              environment: process.env.NODE_ENV || 'development',
            },
          });
        }

        priceId = price.id;
      } catch (priceError) {
        console.error('Error creating/finding price:', priceError);
        return res.status(500).json({ error: 'Failed to set up pricing' });
      }

      // Create subscription with 7-day trial
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: 7,
        metadata: {
          planName: planName,
          userId: user.id.toString(),
        },
      });

      // Calculate trial end date
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      // Update user with subscription info and trial end date
      await storage.updateUser(user.id, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'trialing',
        trialEndsAt: trialEndDate,
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        trialEndDate: trialEndDate.toISOString(),
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ error: error.message || 'Failed to create subscription' });
    }
  });

  app.get("/api/subscription", requireAuth, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    try {
      const user = await storage.getUser(req.session.userId!);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ error: "No subscription found" });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ['latest_invoice.payment_intent', 'default_payment_method'],
      });

      // Update local subscription status
      await storage.updateUser(user.id, {
        subscriptionStatus: subscription.status,
      });

      res.json({
        ...subscription,
        trialEndsAt: user.trialEndsAt,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        }
      });
    } catch (error: any) {
      console.error('Subscription retrieval error:', error);
      res.status(500).json({ error: error.message || 'Failed to retrieve subscription' });
    }
  });

  app.post("/api/cancel-subscription", requireAuth, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    try {
      const user = await storage.getUser(req.session.userId!);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ error: "No subscription found" });
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      res.json({ success: true, subscription });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reactivate-subscription", requireAuth, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    try {
      const user = await storage.getUser(req.session.userId!);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ error: "No subscription found" });
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      res.json({ success: true, subscription });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/update-payment-method", requireAuth, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    try {
      const user = await storage.getUser(req.session.userId!);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ error: "No customer found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/billing`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook endpoint for Stripe events
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // For development/testing, just parse the body directly
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object;
          const userId = subscription.metadata?.userId;
          
          if (userId) {
            await storage.updateUser(parseInt(userId), {
              subscriptionStatus: subscription.status,
            });
          }
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          if (invoice.subscription) {
            // Update subscription status on successful payment
            const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
            const subUserId = sub.metadata?.userId;
            
            if (subUserId) {
              await storage.updateUser(parseInt(subUserId), {
                subscriptionStatus: sub.status,
              });
            }
          }
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          if (failedInvoice.subscription) {
            const failedSub = await stripe.subscriptions.retrieve(failedInvoice.subscription as string);
            const failedUserId = failedSub.metadata?.userId;
            
            if (failedUserId) {
              await storage.updateUser(parseInt(failedUserId), {
                subscriptionStatus: failedSub.status,
              });
            }
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
