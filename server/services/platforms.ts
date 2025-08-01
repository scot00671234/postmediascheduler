import { UserPlatformConnection } from "@shared/schema";

export interface PlatformLimits {
  maxTextLength: number;
  maxImages: number;
  maxVideos: number;
  supportsScheduling: boolean;
  supportsThreads: boolean;
}

export interface PostContent {
  text: string;
  images?: string[];
  videos?: string[];
  scheduledAt?: Date;
}

export interface PlatformPostResult {
  success: boolean;
  postId?: string;
  error?: string;
  metadata?: any;
}

export abstract class PlatformPublisher {
  abstract publish(connection: UserPlatformConnection, content: PostContent): Promise<PlatformPostResult>;
  abstract getLimits(): PlatformLimits;
  abstract adaptContent(content: PostContent): PostContent;
}

export class TwitterPublisher extends PlatformPublisher {
  getLimits(): PlatformLimits {
    return {
      maxTextLength: 280,
      maxImages: 4,
      maxVideos: 1,
      supportsScheduling: false,
      supportsThreads: true,
    };
  }

  adaptContent(content: PostContent): PostContent {
    let text = content.text;
    if (text.length > this.getLimits().maxTextLength) {
      text = text.substring(0, this.getLimits().maxTextLength - 3) + "...";
    }
    
    return {
      ...content,
      text,
      images: content.images?.slice(0, this.getLimits().maxImages),
      videos: content.videos?.slice(0, this.getLimits().maxVideos),
    };
  }

  async publish(connection: UserPlatformConnection, content: PostContent): Promise<PlatformPostResult> {
    try {
      const adaptedContent = this.adaptContent(content);
      
      const response = await fetch("https://api.twitter.com/2/tweets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${connection.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: adaptedContent.text,
          media: adaptedContent.images?.length ? {
            media_ids: adaptedContent.images,
          } : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Twitter API error: ${error}` };
      }

      const result = await response.json();
      return {
        success: true,
        postId: result.data.id,
        metadata: result,
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Twitter publish failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
}

export class LinkedInPublisher extends PlatformPublisher {
  getLimits(): PlatformLimits {
    return {
      maxTextLength: 3000,
      maxImages: 9,
      maxVideos: 1,
      supportsScheduling: true,
      supportsThreads: false,
    };
  }

  adaptContent(content: PostContent): PostContent {
    let text = content.text;
    if (text.length > this.getLimits().maxTextLength) {
      text = text.substring(0, this.getLimits().maxTextLength - 3) + "...";
    }
    
    return {
      ...content,
      text,
      images: content.images?.slice(0, this.getLimits().maxImages),
      videos: content.videos?.slice(0, this.getLimits().maxVideos),
    };
  }

  async publish(connection: UserPlatformConnection, content: PostContent): Promise<PlatformPostResult> {
    try {
      const adaptedContent = this.adaptContent(content);
      
      const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${connection.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: `urn:li:person:${connection.platformUserId}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: adaptedContent.text,
              },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `LinkedIn API error: ${error}` };
      }

      const result = await response.json();
      return {
        success: true,
        postId: result.id,
        metadata: result,
      };
    } catch (error) {
      return { 
        success: false, 
        error: `LinkedIn publish failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
}

export class PlatformService {
  private publishers: Map<string, PlatformPublisher> = new Map();

  constructor() {
    this.publishers.set("twitter", new TwitterPublisher());
    this.publishers.set("linkedin", new LinkedInPublisher());
  }

  getPublisher(platform: string): PlatformPublisher | undefined {
    return this.publishers.get(platform);
  }

  getAllPlatforms(): string[] {
    return Array.from(this.publishers.keys());
  }

  getLimits(platform: string): PlatformLimits | undefined {
    return this.publishers.get(platform)?.getLimits();
  }

  async publishToMultiplePlatforms(
    connections: UserPlatformConnection[],
    content: PostContent,
    selectedPlatforms: string[]
  ): Promise<Map<string, PlatformPostResult>> {
    const results = new Map<string, PlatformPostResult>();

    for (const platformName of selectedPlatforms) {
      const connection = connections.find(c => c.platform.name === platformName);
      if (!connection) {
        results.set(platformName, { 
          success: false, 
          error: `No connection found for platform: ${platformName}` 
        });
        continue;
      }

      const publisher = this.getPublisher(platformName);
      if (!publisher) {
        results.set(platformName, { 
          success: false, 
          error: `No publisher found for platform: ${platformName}` 
        });
        continue;
      }

      try {
        const result = await publisher.publish(connection, content);
        results.set(platformName, result);
      } catch (error) {
        results.set(platformName, { 
          success: false, 
          error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
        });
      }
    }

    return results;
  }
}

export const platformService = new PlatformService();