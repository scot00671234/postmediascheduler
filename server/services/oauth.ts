import { Request, Response } from "express";
import { storage } from "../storage";
import { nanoid } from "nanoid";
import { createHash, randomBytes } from "crypto";

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

export class OAuthService {
  private configs: Map<string, OAuthConfig> = new Map();
  private codeVerifiers: Map<string, string> = new Map(); // Temporary storage for code verifiers

  constructor() {
    this.initializeConfigs();
  }

  private initializeConfigs() {
    // Twitter OAuth 2.0 configuration (ensure your Twitter app supports OAuth 2.0)
    this.configs.set("twitter", {
      clientId: process.env.TWITTER_CLIENT_ID || "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
      redirectUri: `${this.getBaseUrl()}/api/oauth/callback/twitter`,
      scopes: ["tweet.read", "tweet.write", "users.read"],
      authUrl: "https://twitter.com/i/oauth2/authorize",
      tokenUrl: "https://api.twitter.com/2/oauth2/token",
    });

    // LinkedIn API configuration
    this.configs.set("linkedin", {
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
      redirectUri: `${this.getBaseUrl()}/api/oauth/callback/linkedin`,
      scopes: ["r_liteprofile", "w_member_social"],
      authUrl: "https://www.linkedin.com/oauth/v2/authorization",
      tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    });
  }

  private getBaseUrl(): string {
    const domains = process.env.REPLIT_DOMAINS?.split(",") || [];
    return domains.length > 0 ? `https://${domains[0]}` : "http://localhost:5000";
  }

  public getAuthUrl(platform: string, userId: number): string {
    const config = this.configs.get(platform);
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const state = this.generateState(userId, platform);
    
    // Generate PKCE parameters for Twitter OAuth 2.0
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    
    // Store code verifier temporarily (in a real app, use Redis or similar)
    this.storeCodeVerifier(userId, platform, codeVerifier);
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: config.scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const authUrl = `${config.authUrl}?${params.toString()}`;
    console.log(`Generated OAuth URL for ${platform}:`, authUrl);
    console.log(`Client ID: ${config.clientId.substring(0, 10)}...`);
    console.log(`Redirect URI: ${config.redirectUri}`);
    console.log(`Scopes: ${config.scopes.join(" ")}`);
    console.log(`Code Challenge: ${codeChallenge.substring(0, 10)}...`);
    
    return authUrl;
  }

  public async handleCallback(platform: string, code: string, state: string): Promise<{
    userId: number;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    userInfo: any;
  }> {
    const config = this.configs.get(platform);
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Verify state and extract user ID
    const { userId } = this.verifyState(state, platform);

    // Get stored code verifier for PKCE
    const codeVerifier = this.getCodeVerifier(userId, platform);
    
    // Exchange code for tokens
    const tokenResponse = await this.exchangeCodeForTokens(config, code, codeVerifier);
    const userInfo = await this.getUserInfo(platform, tokenResponse.access_token);

    return {
      userId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: tokenResponse.expires_in 
        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
        : undefined,
      userInfo,
    };
  }

  private generateState(userId: number, platform: string): string {
    return Buffer.from(JSON.stringify({
      userId,
      platform,
      timestamp: Date.now(),
      nonce: nanoid(),
    })).toString("base64");
  }

  private verifyState(state: string, platform: string): { userId: number } {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString());
      
      // Verify platform matches
      if (decoded.platform !== platform) {
        throw new Error("Invalid state: platform mismatch");
      }

      // Verify timestamp (within 10 minutes)
      const now = Date.now();
      const stateTime = decoded.timestamp;
      if (now - stateTime > 10 * 60 * 1000) {
        throw new Error("Invalid state: expired");
      }

      return { userId: decoded.userId };
    } catch (error) {
      throw new Error("Invalid state parameter");
    }
  }

  private async exchangeCodeForTokens(config: OAuthConfig, code: string, codeVerifier?: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code,
    });

    // Add code verifier for PKCE (Twitter OAuth 2.0)
    if (codeVerifier) {
      body.append("code_verifier", codeVerifier);
    }

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return await response.json();
  }

  private async getUserInfo(platform: string, accessToken: string): Promise<any> {
    const endpoints: Record<string, string> = {
      twitter: "https://api.twitter.com/2/users/me",
      instagram: "https://graph.instagram.com/me?fields=id,username",
      linkedin: "https://api.linkedin.com/v2/me",
      facebook: "https://graph.facebook.com/me",
      tiktok: "https://open-api.tiktok.com/user/info/",
      youtube: "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      threads: "https://graph.threads.net/me",
      pinterest: "https://api.pinterest.com/v5/user_account",
    };

    const endpoint = endpoints[platform];
    if (!endpoint) {
      throw new Error(`No user info endpoint for platform: ${platform}`);
    }

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch user info: ${error}`);
    }

    return await response.json();
  }

  public async refreshToken(platform: string, refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }> {
    const config = this.configs.get(platform);
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    });

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in 
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  // PKCE helper methods
  private generateCodeVerifier(): string {
    return randomBytes(32).toString('base64url');
  }

  private generateCodeChallenge(codeVerifier: string): string {
    return createHash('sha256').update(codeVerifier).digest('base64url');
  }

  private storeCodeVerifier(userId: number, platform: string, codeVerifier: string): void {
    const key = `${userId}:${platform}`;
    this.codeVerifiers.set(key, codeVerifier);
    
    // Clean up after 10 minutes
    setTimeout(() => {
      this.codeVerifiers.delete(key);
    }, 10 * 60 * 1000);
  }

  private getCodeVerifier(userId: number, platform: string): string {
    const key = `${userId}:${platform}`;
    const codeVerifier = this.codeVerifiers.get(key);
    if (!codeVerifier) {
      throw new Error('Code verifier not found or expired');
    }
    
    // Clean up after use
    this.codeVerifiers.delete(key);
    return codeVerifier;
  }
}

export const oauthService = new OAuthService();
