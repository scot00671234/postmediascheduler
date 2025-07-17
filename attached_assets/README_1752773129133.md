# SaaS Boilerplate

A modern, production-ready SaaS boilerplate built with React, TypeScript, Node.js, and PostgreSQL. This boilerplate provides a solid foundation for building any SaaS application with authentication, subscription management, and a flexible item system.

## Features

- 🔐 **Authentication System** - Complete login/logout with session management
- 💳 **Subscription Management** - Stripe integration for payments and subscriptions
- 🗃️ **Generic Item System** - Flexible database schema for any type of content
- 🎨 **Modern UI** - Built with Radix UI components and Tailwind CSS
- 📱 **Responsive Design** - Works on all devices
- 🔒 **Security** - Proper authentication, authorization, and data validation
- 🚀 **Production Ready** - Configured for deployment to Replit or other platforms

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development and building
- **Radix UI** for accessible components
- **Tailwind CSS** for styling
- **TanStack Query** for data fetching and caching
- **Wouter** for routing

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **Stripe** for payment processing
- **Session-based authentication**

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Stripe account (for payments)

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   ```bash
   DATABASE_URL=your_postgresql_connection_string
   STRIPE_SECRET_KEY=your_stripe_secret_key
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   SESSION_SECRET=your_session_secret
   ```

4. Run database migrations:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
├── client/                 # Frontend code
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utility functions
├── server/                 # Backend code
│   ├── auth.ts            # Authentication logic
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── db.ts              # Database connection
├── shared/                 # Shared code
│   └── schema.ts          # Database schema and types
└── README.md
```

## Key Components

### Database Schema

The boilerplate includes a flexible schema:

- **users** - User accounts with subscription info
- **items** - Generic items table for any content
- **sessions** - Session management

### Authentication

- Session-based authentication
- Login/logout functionality
- User registration
- Password reset (ready for email integration)

### Subscription System

- Free tier: 1 item limit
- Pro tier: Unlimited items
- Stripe integration for payments
- Automatic subscription management

### Generic Item System

The `items` table is designed to be flexible:
- `name` - Item title
- `description` - Item description
- `data` - JSON field for any item-specific data
- `metadata` - JSON field for additional metadata
- `isActive` - Soft delete functionality

## Customization

### Adding New Item Types

1. Extend the `data` field in the items table with your specific data structure
2. Create specialized components for your item types
3. Update the API routes to handle your specific logic

### Modifying Subscription Plans

1. Update the Stripe product configuration
2. Modify the subscription limits in `server/routes.ts`
3. Update the UI to reflect new plan features

### Adding New Pages

1. Create a new page component in `client/src/pages/`
2. Add the route to `client/src/App.tsx`
3. Update navigation in `client/src/components/navigation.tsx`

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/login` - Login
- `POST /api/logout` - Logout

### Items
- `GET /api/items` - Get user's items
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get specific item
- `PATCH /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Subscriptions
- `POST /api/create-subscription` - Create Stripe checkout session
- `POST /api/subscription-success` - Handle successful payment
- `POST /api/stripe-webhook` - Handle Stripe webhooks

## Deployment

### Replit Deployment

1. Push your code to Replit
2. Set environment variables in Replit Secrets
3. The app will automatically deploy

### Other Platforms

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Stripe
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Session
SESSION_SECRET=your-secret-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues, please open an issue in the repository.