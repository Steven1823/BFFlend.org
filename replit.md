# FriendLend - P2P Rental Marketplace

## Overview

FriendLend is a Web3-powered peer-to-peer rental marketplace designed specifically for African users. The platform allows users to rent out their unused items to others in their community, earning money while providing access to tools, equipment, and other goods without the need for purchase.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: React Router for client-side navigation
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and context (wallet integration prepared)
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Storage**: In-memory storage for development, with interface for database migration
- **API Structure**: RESTful APIs with `/api` prefix

### Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── migrations/      # Database migrations
└── dist/           # Production build output
```

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` with Zod validation
- **Current Tables**: Users table with username/password fields
- **Migration Strategy**: Drizzle Kit for schema management

### Authentication & User Management
- **Current State**: Basic user schema prepared
- **Planned**: Web3 wallet integration (Wagmi configuration files present)
- **Storage Interface**: Abstracted storage layer for easy database migration

### UI Components
- **Component Library**: shadcn/ui with Radix UI primitives
- **Design System**: Tailwind CSS with custom color scheme (emerald primary)
- **Responsive Design**: Mobile-first approach with responsive breakpoints

### Route Structure
- **Landing Page**: Marketing and feature presentation
- **Browse Page**: Item discovery with search and filters
- **Item Detail**: Individual item pages with rental information
- **Dashboard**: Separate views for borrowers and lenders

## Data Flow

### Current Implementation
1. **Frontend**: React components make API calls to Express backend
2. **Backend**: Express routes handle requests and interact with storage layer
3. **Storage**: In-memory storage for development (MemStorage class)
4. **Database**: PostgreSQL schema ready for production deployment

### Planned Web3 Integration
- Wallet connection for user authentication
- Smart contract interaction for rental agreements
- Celo blockchain for payments (mentioned in PWA manifest)

## External Dependencies

### Core Dependencies
- **Frontend**: React, React Router, Tailwind CSS, shadcn/ui
- **Backend**: Express, Drizzle ORM, Neon Database client
- **Development**: Vite, TypeScript, tsx for development server
- **Database**: PostgreSQL via Neon serverless

### UI Components
- Comprehensive Radix UI component collection
- Custom styling with class-variance-authority
- Icons from Lucide React

### Build & Development
- Vite for frontend bundling
- esbuild for backend compilation
- Replit-specific development tools and error handling

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Environment variable-based configuration

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: esbuild bundle to `dist/index.js`
- **Database**: Drizzle migrations for schema deployment
- **Deployment**: Node.js production server

### Environment Configuration
- Database URL configuration via environment variables
- Separate development and production configurations
- Replit-specific development banner and tools

### Key Features Ready for Implementation
1. **User Authentication**: Database schema and storage interface prepared
2. **Item Listings**: UI components and routing structure in place
3. **Search & Browse**: Filter and category system implemented
4. **Dashboards**: Separate interfaces for borrowers and lenders
5. **Responsive Design**: Mobile-first approach with PWA manifest
6. **Web3 Integration**: Wallet connection hooks and configuration files prepared

The application is structured as a full-stack TypeScript application with clear separation between frontend, backend, and shared code, ready for rapid development and deployment.