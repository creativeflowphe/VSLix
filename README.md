# Booking SaaS Platform

A comprehensive multi-tenant booking management platform designed for salons, spas, and service-based businesses. This platform provides role-based dashboards for administrators, business owners, and clients with features including appointment scheduling, service management, analytics, reviews, and marketing campaigns.

## Features

### Multi-Role Dashboard System
- **Master Admin Dashboard**: Complete system oversight with analytics, user management, and platform-wide controls
- **Business Owner Dashboard**: Manage salons, services, staff, bookings, and business analytics
- **Client Dashboard**: Book appointments, view history, manage favorites, and leave reviews

### Core Functionality
- Real-time booking system with availability management
- Service catalog with categories and pricing
- Staff scheduling and management
- Review and rating system
- Marketing campaign management
- Notification system with customizable templates
- Marketplace for discovering businesses
- Advanced analytics and reporting
- Theme customization (light/dark mode)

### Technical Highlights
- Built with React, TypeScript, and Vite
- Supabase backend with PostgreSQL database
- Row Level Security (RLS) for data protection
- Serverless Edge Functions for automated workflows
- Chart.js for data visualization
- Responsive design with Tailwind CSS
- Real-time notifications

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Functions**: Supabase Edge Functions
- **Charts**: Chart.js, react-chartjs-2
- **Icons**: Lucide React

## Project Structure

```
project/
├── src/
│   ├── components/          # React components
│   │   ├── charts/         # Chart components
│   │   ├── AdminDashboard.tsx
│   │   ├── OwnerDashboard.tsx
│   │   ├── ClientDashboard.tsx
│   │   ├── MasterDashboard.tsx
│   │   └── ...
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities and configurations
│   └── App.tsx             # Main application component
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Database migrations
└── ...
```

## Prerequisites

Before you begin, ensure you have:
- Node.js (v18 or higher)
- npm or yarn
- A Supabase account
- Git (optional, for version control)

## Quick Start

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables (see INSTALLATION.md)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to the URL shown in the terminal (typically http://localhost:5173)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## User Roles

### Master Admin
- Full system access
- Platform-wide analytics
- User and business management
- System configuration

### Business Owner
- Manage salon/spa details
- Service and staff management
- Booking oversight
- Business analytics
- Marketing campaigns
- Review management

### Client
- Browse marketplace
- Book appointments
- View booking history
- Manage favorites
- Leave reviews
- Profile management

## Database Schema

The platform uses a comprehensive PostgreSQL schema including:
- User profiles and roles
- Business (salons) management
- Services and categories
- Bookings and appointments
- Reviews and ratings
- Marketing campaigns
- Notification templates
- Analytics tracking

All tables are protected with Row Level Security (RLS) policies.

## Edge Functions

- `send-notification` - Handles notification delivery
- `auto-review-request` - Automatically sends review requests after appointments

## Security

- Row Level Security (RLS) enabled on all tables
- Authentication required for protected routes
- Role-based access control
- Secure API endpoints
- Environment variable protection

## Contributing

This is a private project. For contributions, please contact the project maintainer.

## License

Private and proprietary.

## Support

For support and questions, please refer to the INSTALLATION.md guide or contact the development team.

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

Optional:
- `VITE_STRIPE_PUBLIC_KEY` - Stripe public key (for payment processing)

## Deployment

This application can be deployed to any static hosting service:
- Vercel
- Netlify
- AWS Amplify
- GitHub Pages
- And more

See INSTALLATION.md for detailed deployment instructions.
