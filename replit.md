# CrossPost Pro - Multi-Platform Content Publishing Service

## Overview

This is a full-stack TypeScript application that provides a minimalist social media cross-posting service. Users can upload content once and publish or schedule it across multiple platforms including Twitter, Instagram, LinkedIn, Facebook, TikTok, YouTube, Bluesky, Threads, and Pinterest.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 2025
- **App Rebranding**: Changed application name from "CrossPost Pro" to "Post Media"
- **File Upload System**: Implemented complete file upload functionality with:
  - Multer for file handling
  - Sharp for image processing and optimization
  - Database integration for media file metadata
  - Frontend upload UI with drag-and-drop support
- **Email Verification**: Added email confirmation system using SendGrid
- **UI Improvements**: 
  - Removed generic profile avatar, replaced with user initials
  - Removed bio field from settings page
  - Enhanced composer with file upload interface
- **Database Updates**: 
  - Added media_files table for file metadata
  - Added email verification fields to users table
  - Updated posts table to reference media files by ID instead of URLs

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon (serverless PostgreSQL)
- **Authentication**: Session-based auth with bcrypt for password hashing
- **API Design**: RESTful endpoints with JSON responses
- **File Storage**: Local file system with multer and sharp for image processing
- **Email Service**: SendGrid integration for email verification

### Key Components

#### Authentication System
- Session-based authentication using express-session
- Password hashing with bcrypt
- Protected routes with middleware
- User registration and login endpoints

#### Database Schema
- **Users**: Basic user accounts with username, email, password, email verification status
- **Platforms**: Available social media platforms with metadata
- **User Platform Connections**: OAuth tokens and connection details
- **Posts**: Content with scheduling and status tracking, media file references
- **Media Files**: Uploaded images and videos with metadata
- **Job Queue**: Background job processing for publishing

#### OAuth Integration
- Configurable OAuth 2.0 flows for each platform
- Token storage and refresh handling
- Platform-specific scopes and permissions
- Callback URL handling for authorization codes

#### Content Publishing System
- Unified post model supporting text, images, and videos
- Platform-specific content adaptation (character limits, etc.)
- Scheduling system with background job processing
- Status tracking per platform with retry mechanisms

#### Job Queue System
- Background job processing for publish operations
- Exponential backoff retry logic for failed posts
- Job scheduling for future publication
- Status tracking and error handling

## Data Flow

1. **User Authentication**: Users register/login through session-based auth
2. **Platform Connection**: OAuth flow to connect social media accounts
3. **Content Creation**: Users compose posts with platform selection
4. **Publishing Pipeline**: 
   - Immediate publishing creates jobs in queue
   - Scheduled posts are stored and processed by scheduler
   - Jobs are processed with platform-specific adaptations
   - Status updates are tracked per platform

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Drizzle ORM**: Type-safe database access with schema management
- **Connection Pooling**: @neondatabase/serverless for WebSocket connections

### Social Media APIs
- Platform-specific OAuth 2.0 implementations
- API clients for each social media platform
- Token management and refresh handling

### UI Components
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- Express server with TypeScript compilation via tsx
- Environment variables for API keys and database connection
- Concurrent development setup with shared types

### Production
- Frontend: Vite build to static assets
- Backend: esbuild compilation to single bundle
- Database: Neon serverless PostgreSQL
- Session storage: PostgreSQL with connect-pg-simple
- Environment-based configuration

### Database Management
- Drizzle migrations for schema changes
- Push command for development schema updates
- Shared schema types between frontend and backend

### Security Considerations
- Session secret configuration
- OAuth client secret management
- Database connection string security
- CORS and security middleware setup

The application follows a clean separation of concerns with shared TypeScript types, making it maintainable and scalable for adding new platforms or features.