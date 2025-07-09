import { apiRequest } from "@/lib/queryClient";

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiRequest("POST", "/api/auth/login", credentials),
  
  register: (userData: { username: string; email: string; password: string }) =>
    apiRequest("POST", "/api/auth/register", userData),
  
  logout: () => apiRequest("POST", "/api/auth/logout"),
  
  getMe: () => apiRequest("GET", "/api/auth/me"),

  // Platforms
  getPlatforms: () => apiRequest("GET", "/api/platforms"),
  
  getPlatformLimits: (platform: string) => 
    apiRequest("GET", `/api/platforms/${platform}/limits`),

  // OAuth
  connectPlatform: (platform: string) =>
    apiRequest("GET", `/api/oauth/connect/${platform}`),

  // Connections
  getConnections: () => apiRequest("GET", "/api/connections"),
  
  deleteConnection: (id: number) =>
    apiRequest("DELETE", `/api/connections/${id}`),

  // Posts
  publishPost: (data: {
    content: string;
    platforms: string[];
    mediaUrls?: string[];
    scheduledAt?: string;
  }) => apiRequest("POST", "/api/publish", data),
  
  getPosts: () => apiRequest("GET", "/api/posts"),
  
  getPost: (id: number) => apiRequest("GET", `/api/posts/${id}`),
  
  deletePost: (id: number) => apiRequest("DELETE", `/api/posts/${id}`),
  
  getJobStatus: (jobId: string) => apiRequest("GET", `/api/status/${jobId}`),

  // Analytics
  getDashboardStats: () => apiRequest("GET", "/api/analytics/dashboard"),
};
