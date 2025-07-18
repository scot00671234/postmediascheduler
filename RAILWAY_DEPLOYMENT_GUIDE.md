# Railway Deployment Guide - CrossPost Pro

## Complete Setup for Railway Production Deployment

### 1. Create Railway Project

1. Go to [Railway](https://railway.app/) and create a new project
2. Connect your GitHub repository
3. Add a PostgreSQL database service

### 2. Configure Environment Variables

In your Railway project dashboard, add these environment variables:

**Required:**
```
DATABASE_URL=${{ Postgres.DATABASE_URL }}
SESSION_SECRET=your-secure-random-session-secret-key
NODE_ENV=production
PORT=3000
```

**Optional (for email features):**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

**Optional (for Stripe subscriptions):**
```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Optional (for OAuth):**
```
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=https://your-app.railway.app/api/auth/linkedin/callback
```

### 3. Database Setup

The application will automatically:
- Create all required database tables on first startup
- Set up foreign key relationships
- Insert default platform data (X/Twitter, LinkedIn)
- Create session table for authentication

**No manual SQL required!** The app handles all database schema creation automatically.

### 4. Build Configuration

The project includes:
- `nixpacks.toml` - Specifies Node.js 18 and build commands
- `railway.json` - Railway-specific deployment configuration
- `build-production.js` - Custom build script for production

### 5. Deploy

1. Push your code to GitHub
2. Railway will automatically build and deploy
3. Check deployment logs for any issues
4. Your app will be available at `https://your-app.railway.app`

### 6. Post-Deployment

After successful deployment:
- Visit `/health` to verify the app is running
- Check database tables are created in Railway PostgreSQL dashboard
- Test user registration and login
- Verify file uploads work (using /tmp/uploads in Railway)

### 7. Common Issues and Solutions

**Database Connection:**
- Ensure PostgreSQL service is running
- Verify DATABASE_URL environment variable
- Check connection pool settings

**File Uploads:**
- Railway containers use `/tmp/uploads` for temporary files
- Files are automatically cleaned up on container restart
- Consider using external storage (S3, Cloudinary) for production

**Session Management:**
- Uses PostgreSQL for session storage in production
- Automatic session table creation
- HTTPS cookies for security

**Build Errors:**
- Check Node.js version compatibility (using Node.js 18)
- Verify all dependencies are in package.json
- Review build logs for specific errors

### 8. Environment-Specific Behavior

**Production Features:**
- Automatic database schema creation
- PostgreSQL session storage
- HTTPS security settings
- Optimized static file serving
- Production error handling

**Development Features:**
- Hot reload with Vite
- In-memory sessions
- Detailed error logging
- Development CORS settings

### 9. Health Monitoring

Available endpoints:
- `/health` - Application health check
- `/` - API status (in production)
- All API routes under `/api/*`

### 10. Troubleshooting Production Issues

**Check these in order:**

1. **Database Connection:**
   ```bash
   # Check if DATABASE_URL is set
   echo $DATABASE_URL
   ```

2. **Environment Variables:**
   ```bash
   # Verify NODE_ENV is production
   echo $NODE_ENV
   ```

3. **Build Output:**
   - Check that `dist/` directory exists
   - Verify `index.js` is created
   - Ensure frontend assets are built

4. **Database Tables:**
   - Check Railway PostgreSQL dashboard
   - Verify tables are created automatically
   - Look for migration logs in deployment logs

**Success Indicators:**
- "Database tables created successfully in production"
- "Default data inserted successfully"
- "CrossPost Pro API is running"
- All database tables visible in Railway dashboard

This deployment is now 100% production-ready for Railway with automatic database setup and zero manual configuration required.