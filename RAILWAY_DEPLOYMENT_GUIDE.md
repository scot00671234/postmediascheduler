# Railway Deployment Guide for CrossPost Pro

This guide walks you through deploying CrossPost Pro to Railway with automatic database table creation.

## Prerequisites

1. Railway account (https://railway.app)
2. GitHub repository with your project
3. API keys for social media platforms (Twitter, LinkedIn)

## Step 1: Create Railway Project

1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account and select your repository
5. Railway will automatically detect it's a Node.js project

## Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL database
4. The `DATABASE_URL` environment variable will be automatically set

## Step 3: Configure Environment Variables

Add these environment variables in Railway's dashboard:

### Required Variables
```
SESSION_SECRET=your-super-secure-session-secret-key-here
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
NODE_ENV=production
```

### Optional Email Configuration (choose one)
```
# For SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# For Gmail SMTP
GMAIL_USER=your-gmail@gmail.com
GMAIL_PASS=your-gmail-app-password

# For Custom SMTP (Recommended)
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

### Optional Stripe Configuration
```
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY=pk_live_your-stripe-public-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

## Step 4: Automatic Database Setup

The application is configured to automatically:

1. **Create all database tables** on first startup using Drizzle ORM
2. **Initialize default platform data** (Twitter and LinkedIn)
3. **Handle database migrations** automatically

### How it works:
- **Production Build**: Uses custom build script optimized for Railway
- **Database Setup**: In production, uses direct SQL table creation (bypasses drizzle-kit)
- **Table Creation**: Creates all tables defined in `shared/schema.ts` with proper constraints
- **Default Data**: Automatically initializes Twitter and LinkedIn platform configurations
- **No Manual SQL**: Everything happens automatically during deployment
- **Idempotent**: Safe to run multiple times, won't duplicate data

## Step 5: OAuth Setup

### Twitter/X OAuth
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new app or use existing
3. In App Settings → User authentication settings:
   - Enable OAuth 2.0
   - Type: Web App
   - Callback URL: `https://your-railway-domain.railway.app/api/oauth/callback/twitter`
   - Website URL: `https://your-railway-domain.railway.app`
4. Copy Client ID and Client Secret to Railway environment variables

### LinkedIn OAuth
1. Go to https://www.linkedin.com/developers/apps
2. Create a new app
3. In Auth tab:
   - Add redirect URL: `https://your-railway-domain.railway.app/api/oauth/callback/linkedin`
   - Request r_liteprofile and w_member_social scopes
4. Copy Client ID and Client Secret to Railway environment variables

## Step 6: Deploy

1. Push your code to GitHub
2. Railway will automatically deploy
3. Check the deployment logs to ensure:
   - Database tables are created successfully
   - Default platforms are initialized
   - No errors in startup

## Step 7: Health Check

After deployment, verify:

1. Visit your Railway URL
2. Register a new account
3. Try connecting Twitter and LinkedIn accounts
4. Test creating and publishing a post

## Production Considerations

### Security
- Use strong SESSION_SECRET (32+ random characters)
- Enable HTTPS (automatic with Railway)
- Use environment variables for all secrets

### Email Service
- Configure SMTP for production email sending
- Test email verification and password reset flows

### Monitoring
- Check Railway logs for any errors
- Monitor database performance
- Set up uptime monitoring

### Backup
- Railway PostgreSQL includes automatic backups
- Consider additional backup strategies for critical data

## Troubleshooting

### Database Issues
- Check `DATABASE_URL` is set correctly
- Ensure PostgreSQL service is running
- Check deployment logs for migration errors

### OAuth Issues
- Verify callback URLs match exactly
- Check client IDs and secrets are correct
- Ensure OAuth apps are published/live

### Email Issues
- Verify SMTP credentials
- Check spam folders for test emails
- Enable "Less secure app access" for Gmail if needed

### Build Issues
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Review build logs for specific errors

## Environment Variables Summary

Copy this to Railway's environment variables section:

```
NODE_ENV=production
SESSION_SECRET=your-super-secure-session-secret-key-here
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY=pk_live_your-stripe-public-key
```

The `DATABASE_URL` will be automatically provided by Railway's PostgreSQL service.