# Customer Manager - Client & Payment System

## Overview

This is a full-stack web application for managing clients and their payment codes across different services. The system provides a dashboard for viewing statistics, managing client information, and handling payment codes for various services. It includes features like client search, data export, and print functionality for thermal receipts. The application uses a modern React frontend with a Node.js/Express backend and PostgreSQL database with Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Component Structure**: Component-based architecture with reusable UI components in `/client/src/components/ui/`

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error handling middleware
- **Development**: Vite middleware integration for hot module replacement
- **Storage**: Abstracted storage interface with in-memory implementation (ready for database integration)

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured via Neon serverless)
- **Schema**: Four main tables - clients, services, payment_codes, and search_history
- **Migrations**: Drizzle Kit for database migrations
- **Relationships**: Foreign key relationships between clients, services, and payment codes

### Authentication & Authorization
- Currently no authentication system implemented
- Session management placeholder exists with connect-pg-simple
- Ready for future authentication integration

### Key Features
- **Dashboard**: Statistics overview with client counts and recent activity
- **Client Management**: Full CRUD operations for client data
- **Payment Code System**: Unique codes per service-client combination
- **Search Functionality**: Real-time client search with history tracking
- **Export Capabilities**: CSV export functionality (PDF planned)
- **Print System**: Thermal receipt printing for client payment codes
- **Responsive Design**: Mobile-first responsive design

### Data Flow
1. Frontend components use TanStack Query for API calls
2. Express routes handle business logic and validation
3. Storage layer abstracts database operations
4. Drizzle ORM manages PostgreSQL interactions
5. Real-time updates through query invalidation

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Database ORM and query builder
- **PostgreSQL**: Primary database engine

### UI Framework & Styling
- **Radix UI**: Headless UI component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: Pre-built component library
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type system for JavaScript
- **ESBuild**: JavaScript bundler for production builds
- **PostCSS**: CSS processing tool

### Client-Side Libraries
- **TanStack Query**: Data fetching and caching
- **React Hook Form**: Form state management
- **Zod**: Schema validation library
- **Wouter**: Lightweight routing library
- **Date-fns**: Date utility library

### Server-Side Libraries
- **Express.js**: Web application framework
- **tsx**: TypeScript execution for development
- **connect-pg-simple**: PostgreSQL session store (prepared for future use)

### Replit Integration
- **Replit Vite Plugins**: Development environment integration and error overlay
- **Replit Banner**: Development environment indicator