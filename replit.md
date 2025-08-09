# Overview

rideShare is a full-stack ride-sharing application built with React, Express, and PostgreSQL. The application enables users to book rides as passengers or provide rides as drivers, featuring real-time trip tracking, driver matching, ratings, and payment management. The system supports both rider and driver workflows with a mobile-first responsive design.

# User Preferences

Preferred communication style: Simple, everyday language. Appreciates humor and casual interaction. User expresses appreciation for detailed work ("Claude you're the man", "You're my main man claude").
UI/UX Design: Extremely detail-oriented with specific requirements for spacing, sizing, and alignment. Prefers centered layouts with custom logo integration and precise button/input dimensions. Focuses on mobile-first responsive design with careful attention to font sizes, spacing, and visual hierarchy. Requests precise micro-adjustments to spacing and font sizes.
Navigation: Prefers logout functionality integrated into sidebar menu rather than standalone buttons.
Welcome Page Design: Prefers compact buttons with specific spacing requirements, darker fonts for better readability, and integrated social media/earning platform links. Final specifications: 3xl Welcome heading, 2xl Hello greeting, 2xl button headings, 56px main button icons, 28px social media icons, lg description text, and pb-5 button spacing.
Typography Standards: "Request ride" button uses text-xl font size. Section labels ("Available drivers nearby", "Pickup Location", "Destination") use text-lg. Proper capitalization in toast messages ("Ride requested" not "ride Requested").
Button Layout: Cancel ride button positioned bottom right and smaller (size="sm", text-xs) for subtle interaction.
Header Display: "Hello Jerry, Ready for your next trip?" header only shows on booking step, removed from driver found and other active ride steps for cleaner focus.

# System Architecture

## Frontend Architecture
- **React with TypeScript**: Modern functional components with hooks for state management
- **Wouter**: Lightweight client-side routing library for navigation
- **TanStack Query**: Server state management for API calls and caching
- **Radix UI + Tailwind CSS**: Component library with shadcn/ui design system for consistent styling
- **Mobile-first responsive design**: Optimized for mobile devices with desktop compatibility

## Backend Architecture
- **Express.js**: RESTful API server with TypeScript
- **Authentication**: Replit OAuth integration with session-based authentication
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **API Structure**: RESTful endpoints organized by feature (auth, users, trips, drivers, ratings)

## Database Design
- **PostgreSQL**: Primary database with Drizzle ORM migrations
- **Core Tables**: users, vehicles, trips, ratings, paymentMethods, sessions
- **User Management**: Supports both rider and driver profiles with role switching
- **Trip Lifecycle**: Complete trip state management from request to completion
- **Session Storage**: Dedicated table for user session persistence

## Key Features
- **Dual User Roles**: Users can switch between rider and driver modes
- **Trip Management**: Full lifecycle from booking to completion with status tracking
- **Real-time Updates**: Driver matching and trip progress simulation with mock driver system
- **Rating System**: Bidirectional rating system between riders and drivers
- **Payment Integration**: Payment method management (structure ready for integration)
- **Vehicle Management**: Drivers can manage multiple vehicles
- **Location Services**: Mock location services with plans for real GPS integration
- **Mock Driver System**: John Driver with Toyota Camry available for automatic ride matching
- **Sidebar Navigation**: Clean menu system with logout functionality integrated at bottom

## Development Setup
- **Build System**: Vite for frontend bundling with hot module replacement
- **Development Server**: Concurrent frontend and backend development
- **Database Migrations**: Drizzle Kit for schema management
- **TypeScript**: Full type safety across frontend, backend, and shared schemas

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL hosting service via @neondatabase/serverless
- **Connection Pooling**: Built-in connection pooling for production scalability

## Authentication Services
- **Replit Auth**: OAuth integration using OpenID Connect
- **Session Storage**: PostgreSQL-backed session management with TTL support

## UI Component Libraries
- **Radix UI**: Comprehensive set of accessible React components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Replit Integration**: Specialized plugins for Replit development environment
- **Vite Plugins**: Runtime error overlay and development cartographer
- **TypeScript Configuration**: Shared types between client, server, and database schemas

## Frontend State Management
- **TanStack React Query**: Server state synchronization and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation for API requests and responses

## Styling and Design
- **CSS Variables**: Theme system with light/dark mode support
- **Custom Design Tokens**: Brand colors and spacing defined in CSS variables
- **Responsive Breakpoints**: Mobile-first approach with tablet and desktop variants