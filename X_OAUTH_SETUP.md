# X (Twitter) OAuth Setup Guide

## Step 1: Create X Developer Account

1. Go to https://developer.twitter.com/
2. Sign in with your X account
3. Click "Apply for a developer account"
4. Fill out the application:
   - **Use case**: Building a social media management tool
   - **Description**: "I'm building a social media management application that helps users post content to X and LinkedIn simultaneously. Users will connect their own X accounts to publish content."
   - **Will you make X content available to government entities?**: No
   - **Will your app use Tweet, Retweet, Like, Follow, or Direct Message functionality?**: Yes - Tweet functionality

## Step 2: Create Your App

1. Once approved, go to the Developer Portal
2. Click "Create App"
3. Fill out app details:
   - **App name**: "CrossPost Pro" (or your preferred name)
   - **Description**: "Social media management tool for X and LinkedIn"
   - **Website URL**: `https://your-replit-app.replit.app`
   - **Callback URL**: `https://your-replit-app.replit.app/api/oauth/callback/twitter`
   - **Organization**: Your name or company
   - **App category**: Social media management

## Step 3: Configure OAuth Settings

1. In your app dashboard, go to "Settings" → "User authentication settings"
2. Enable "OAuth 2.0"
3. Set these scopes:
   - `tweet.read`
   - `tweet.write` 
   - `users.read`
   - `offline.access` (for refresh tokens)
4. Set callback URL: `https://your-replit-app.replit.app/api/oauth/callback/twitter`
5. Save settings

## Step 4: Get Your Credentials

1. Go to "Keys and tokens" tab
2. Copy these values:
   - **Client ID** (OAuth 2.0 Client ID)
   - **Client Secret** (OAuth 2.0 Client Secret)

## Step 5: Add to Your App

You'll need to add these environment variables:
- `TWITTER_CLIENT_ID=your_client_id_here`
- `TWITTER_CLIENT_SECRET=your_client_secret_here`

## Important Notes

- **API v2**: Make sure you're using Twitter API v2 (which your app is already configured for)
- **Rate Limits**: Each user will have their own rate limits (300 tweets per 15-minute window)
- **Approval Time**: Developer account approval can take 1-7 days
- **Free Tier**: Basic access is free and sufficient for your use case

## Testing the Connection

Once you have the credentials:
1. Add them to your environment
2. Try connecting your X account in the app
3. Test posting a sample tweet
4. Verify the post appears on your X profile

## Common Issues

- **Invalid callback URL**: Must match exactly what you set in the app settings
- **Missing scopes**: Ensure you have tweet.write permission
- **Rate limiting**: Users can post up to 300 tweets per 15-minute window

Your app is already configured to handle X OAuth correctly - you just need the credentials!