# Railway Deployment Guide for CrossPost Pro

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Required Environment Variables**: Gather these before deployment

## Environment Variables Required

### Database (Auto-configured by Railway)
- `DATABASE_URL` - Automatically set when you add PostgreSQL service

### Essential Configuration
- `SESSION_SECRET` - A secure random string for session encryption
- `NODE_ENV` - Set to `production`

### Stripe Configuration (Required for Subscriptions)
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_`)
- `VITE_STRIPE_PUBLIC_KEY` - Your Stripe publishable key (starts with `pk_`)

### SMTP Email Configuration
- `SMTP_HOST` - Your SMTP server hostname
- `SMTP_PORT` - SMTP port (usually 587)
- `SMTP_SECURE` - `false` for port 587, `true` for port 465
- `SMTP_USER` - Your email username
- `SMTP_PASS` - Your email password or app password

### OAuth Configuration (Optional)
- `TWITTER_CLIENT_ID` - Twitter OAuth client ID
- `TWITTER_CLIENT_SECRET` - Twitter OAuth client secret
- `LINKEDIN_CLIENT_ID` - LinkedIn OAuth client ID
- `LINKEDIN_CLIENT_SECRET` - LinkedIn OAuth client secret

## Deployment Steps

### 1. Create New Project
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your CrossPost Pro repository

### 2. Add PostgreSQL Database
1. In your Railway project dashboard
2. Click "Add Service"
3. Choose "Database" → "PostgreSQL"
4. Railway will automatically create `DATABASE_URL` environment variable

### 3. Configure Environment Variables
1. Click on your web service
2. Go to "Settings" → "Environment"
3. Add all required environment variables listed above

### 4. Configure Build Settings
The project includes `railway.json` and `nixpacks.toml` for automatic configuration:
- Node.js 18 runtime
- Automatic npm install and build
- Starts with `npm start`

### 5. Deploy
1. Railway will automatically deploy when you push to your main branch
2. Wait for the build to complete
3. Your app will be available at your Railway domain

## Post-Deployment Verification

### 1. Database Tables
- Tables are automatically created on first startup
- Check Railway logs to confirm "Schema created successfully"

### 2. Email Service
- Test email verification and password reset
- Check Railway logs for email configuration status

### 3. Stripe Integration
- Test subscription signup flow
- Verify webhook endpoints if using Stripe webhooks

### 4. OAuth Connections
- Test Twitter and LinkedIn connections
- Update OAuth redirect URLs to your Railway domain

## Troubleshooting

### Build Failures
- Check Railway build logs for specific errors
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Database Issues
- Confirm PostgreSQL service is running
- Check DATABASE_URL environment variable
- Review migration logs in Railway console

### Environment Variable Issues
- Verify all required variables are set
- Check for typos in variable names
- Ensure no trailing spaces in values

### SSL/HTTPS Issues
- Railway provides automatic HTTPS
- Update OAuth redirect URLs to use HTTPS
- Check CORS settings if needed

## Production Checklist

- [ ] PostgreSQL database added and connected
- [ ] All environment variables configured
- [ ] Stripe keys added and tested
- [ ] SMTP email configuration verified
- [ ] OAuth redirect URLs updated
- [ ] SSL certificates working
- [ ] Domain configured (if using custom domain)
- [ ] Monitoring and logging set up

## Support

If you encounter issues:
1. Check Railway logs for error messages
2. Verify environment variables are correct
3. Test locally with production environment variables
4. Contact Railway support if infrastructure issues persist

## Security Notes

- Never commit environment variables to your repository
- Use Railway's secret management for sensitive data
- Regularly rotate API keys and secrets
- Enable two-factor authentication on all external services