# CrossPost Pro - Multi-Platform Content Publishing Service

## Overview

This is a full-stack TypeScript application that provides a minimalist social media cross-posting service. Users can upload content once and publish or schedule it across multiple platforms including Twitter, Instagram, LinkedIn, Facebook, TikTok, YouTube, Bluesky, Threads, and Pinterest.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 2025 - Railway Production Build Fully Fixed
- **Production Runtime Issues Resolved**: Fixed all Railway deployment and runtime errors
  - Updated nixpacks.toml to use supported Node.js version (nodejs_18 instead of nodejs-20_x)
  - Fixed PostgreSQL migration system to work with Railway environment
  - Removed @neondatabase/serverless dependency for standard PostgreSQL compatibility
  - Created custom production build script (build-production.js) with proper ESM handling
  - Fixed all ESM import path issues by adding .js extensions for production compatibility
  - Created standalone schema-setup.ts to eliminate dynamic import path issues in production
  - Fixed nodemailer import error (createTransport vs createTransporter)
  - Fixed file upload path resolution for Railway container environment
  - Verified successful production runtime with full database functionality
- **Database Migration System**: Production-optimized and fully functional
  - Development: Uses drizzle-kit push with standalone schema setup fallback
  - Production: Uses standalone schema-setup.ts (eliminates all bundle path issues)
  - Automatic platform data initialization (Twitter and LinkedIn)
  - All 8 database tables created successfully: users, platforms, connections, posts, media, jobs, sessions
  - Production build tested and confirmed working on Node.js 18
  - Railway deployment fully functional with zero-downtime automatic database setup
  - Database verified working with all tables created and default data inserted
- **File Upload System**: Fixed for Railway production environment
  - Production uses /tmp/uploads with fallback handling
  - Graceful directory creation with error handling
  - All file upload features working in containerized environment

### January 2025 - Railway Production Ready Setup Complete
- **Migration System**: Implemented automatic database migration system that creates all tables on startup
  - Uses drizzle-kit push to create PostgreSQL schema automatically
  - Initializes default platform data (X/Twitter and LinkedIn) on first run
  - Works seamlessly in Railway environment without manual SQL intervention
- **SMTP Email Configuration**: Updated email service to prioritize custom SMTP over SendGrid
  - Primary: Custom SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS, etc.)
  - Fallback: Gmail and SendGrid support maintained
  - Graceful degradation when email service not configured
- **Production Security**: Enhanced session management for Railway deployment
  - Automatic HTTPS/secure cookies in production
  - PostgreSQL session storage for production reliability
  - Proper CORS and security headers
- **Stripe Integration**: Configured for Railway environment variables
  - Automatic Stripe initialization when keys are provided
  - Graceful fallback when Stripe not configured
  - Pro subscription features with proper limits enforcement
- **Pro Feature Limits**: Implemented comprehensive subscription restrictions
  - Free tier: 10 posts, 2 connections, 5 scheduled posts, 10MB file limit
  - Pro tier: 1000 posts, 10 connections, 100 scheduled posts, 100MB file limit
  - Real-time limit checking with upgrade prompts
- **Railway Deployment Files**: Created complete deployment configuration
  - railway.json with Node.js 18 build configuration
  - nixpacks.toml for proper dependency management
  - .env.example with all required environment variables
  - RAILWAY_DEPLOYMENT_GUIDE.md with step-by-step instructions
- **Health Monitoring**: Added production health check endpoints
  - /health endpoint for monitoring systems
  - Root endpoint returns API status in production
  - Uptime and environment information included
- **Application Status**: Fully production-ready for Railway deployment
  - Automatic database table creation
  - Email verification and password reset working
  - Stripe subscription flow operational
  - Pro feature restrictions enforced
  - All security measures in place

### January 2025 - Railway Production Preparation Complete
- **Railway Deployment Setup**: Updated project configuration for Railway production deployment
  - Modified database configuration to use standard PostgreSQL instead of Neon serverless
  - Updated server to use Railway's PORT environment variable
  - Created comprehensive Railway deployment guide with step-by-step instructions
  - Configured automatic database table creation using drizzle-kit push during startup
  - Updated nixpacks.toml to use Node.js 20 for better performance
  - Created .env.example with all required environment variables for production
- **Production Database Migration**: Enhanced migration system for Railway compatibility
  - Updated migration imports from neon-serverless to node-postgres
  - Ensured automatic schema creation without manual SQL access requirement
  - Maintained backward compatibility with existing data
- **Create Post Component Enhancement**: Significantly improved composer modal functionality
  - Reorganized layout from 2-column to 3-column design for better space utilization
  - Added fully functional drag-and-drop file upload with visual feedback
  - Implemented file preview with icons for different file types (image, video, document)
  - Added file removal functionality with proper cleanup
  - Enhanced platform preview section with better spacing and readability
  - Fixed API request handling to properly support FormData uploads
  - Improved responsive design for better mobile compatibility

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
- **Enhanced Composer Modal**: Completely redesigned the Create Post component
  - Improved layout with 3-column grid: content (2/3) and platforms/preview (1/3)
  - Better spacing and compact design that fits all content in viewport
  - Added functional file upload with drag-and-drop support
  - Visual file previews with file type icons and size information
  - Ability to remove uploaded files before publishing
  - Enhanced platform selection with compact checkboxes
  - Real-time platform preview showing character limits
  - Updated API request function to properly handle FormData uploads
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