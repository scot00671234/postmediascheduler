# CrossPost Pro - Multi-Platform Content Publishing Service

## Overview

This is a full-stack TypeScript application that provides a minimalist social media cross-posting service. Users can upload content once and publish or schedule it across multiple platforms including Twitter, Instagram, LinkedIn, Facebook, TikTok, YouTube, Bluesky, Threads, and Pinterest.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 2025 - Replit Migration Complete
- **Migration Success**: Successfully migrated project from Replit Agent to Replit environment
- **Database Setup**: PostgreSQL database provisioned and schema migrated successfully
- **Security Enhancement**: Removed Stripe environment variables from frontend billing page display
- **Modern Platform Icons**: Updated X and LinkedIn icons to use modern SVG icons from react-icons/si
  - Replaced emoji icons (🐦, 💼) with official brand icons (SiX, SiLinkedin)
  - Applied consistent styling across platform cards, landing page, and composer modal
  - Improved visual consistency with current UI design standards
- **UI Simplification**: Streamlined navigation by removing Connections and Compose menu items
  - Moved connection functionalities to be accessible directly from dashboard
  - Compose functionality remains accessible via ComposerModal on dashboard
  - Simplified settings page to single page layout without tabs
  - Essential settings: Profile, Billing Information, Customer Service, and Delete Account
  - Added customer service email: clientservicesdigital@gmail.com
  - Delete account functionality cancels subscription at end of billing period
  - Focused on simplicity and reduced cognitive load for users
- **Application Status**: All systems running properly with authentication, content management, and platform integration
- **Progress Tracking**: Created `.local/state/replit/agent/progress_tracker.md` to track migration steps

### January 2025 - Backend Integration and Enhancement
- **Advanced Authentication System**: Integrated comprehensive authentication system with:
  - Enhanced database schema with email verification, password reset, and user profile fields
  - Bcrypt password hashing for security
  - Email verification workflow with nodemailer integration
  - Password reset functionality with token-based system
  - Session-based authentication with middleware support
  - Support for first/last name user profiles and subscription management
- **Database Migration**: Successfully migrated to enhanced schema:
  - Added email verification tokens and expiry timestamps
  - Added password reset tokens and expiry timestamps
  - Added user profile fields (firstName, lastName)
  - Added subscription management fields (subscriptionEndsAt, updatedAt)
  - Maintained integer-based user IDs for existing foreign key compatibility
- **Email Service Integration**: Comprehensive email service with:
  - Support for SendGrid, Gmail, and custom SMTP configurations
  - Email verification templates with branded styling
  - Password reset email templates
  - Welcome and subscription confirmation emails
  - Graceful degradation when email service is not configured
- **Enhanced Storage Layer**: Updated storage interface and implementation:
  - Added methods for email verification and password reset workflows
  - Enhanced user management with subscription tracking
  - Improved error handling and type safety
  - Maintained backward compatibility with existing post and platform systems

### January 2025
- **Stripe Configuration**: Removed hardcoded Stripe keys and updated to use environment variables
  - Updated subscribe.tsx to use VITE_STRIPE_PUBLIC_KEY environment variable
  - Updated billing.tsx to show proper setup instructions
  - Added placeholder keys in .env file for development
  - Created STRIPE_SETUP_GUIDE.md for Railway deployment instructions
  - All Stripe integration now uses environment variables for security
- **Platform Simplification**: Removed all social media platforms except Twitter/X and LinkedIn
  - Simplified OAuth service to focus on professional platforms
  - Removed Instagram, Facebook, TikTok, YouTube, Bluesky, Threads, Pinterest
  - Updated platform cards and publishers to only support Twitter and LinkedIn
  - Streamlined for faster MVP development and easier OAuth setup
- **Project Migration**: Successfully migrated from Replit Agent to Replit environment with:
  - PostgreSQL database setup and schema migration
  - Environment variables configuration (SESSION_SECRET, DATABASE_URL)
  - LinkedIn OAuth credentials configured (LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET)
  - Fixed DOM nesting warnings in login, register, and sidebar components
  - Removed AI Assistant button from composer as requested
  - All dependencies installed and application running properly
- **Project Migration**: Successfully migrated from Replit Agent to Replit environment
- **Landing Page**: Created comprehensive scroll-down landing page with:
  - Hero section with clear value proposition
  - Platform showcase with visual icons
  - Feature highlights with benefits
  - Pricing tiers (Free, Pro, Enterprise)
  - Call-to-action sections
  - Removed "Watch Demo" and "Contact Sales" buttons as requested
- **Design System**: Implemented Apple/Palantir-inspired minimalist design with:
  - Beige, white, grey, and black color palette
  - Clean typography and spacing
  - Subtle shadows and borders
  - Consistent component styling
- **Stripe Subscription System**: Complete subscription flow implemented with:
  - 7-day free trial for Creator plan
  - Single pricing tier: $7 monthly Creator plan
  - Subscription signup, cancellation, and reactivation
  - Payment method updates via Stripe Customer Portal
  - Database schema updated with Stripe fields
  - Full billing management dashboard
- **UI Improvements**: 
  - Removed "AI Assistant" text from composer
  - Functional notification bell with real-time updates
  - Updated routing to use landing page as home
  - Enhanced sidebar with billing section
  - Registration flow now goes directly to subscription signup
- **File Upload System**: Fully functional file upload with:
  - Multer for file handling
  - Sharp for image processing and optimization
  - Database integration for media file metadata
  - Frontend upload UI with drag-and-drop support
- **Database Setup**: 
  - PostgreSQL database provisioned and configured
  - Schema migration completed successfully
  - All tables created and indexed properly
  - Added Stripe-related fields to users table

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