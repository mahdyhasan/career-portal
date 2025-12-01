# Career Portal Architecture Documentation

## Overview

This is a full-stack career portal application built with React, TypeScript, Express, and MySQL. The application serves as a comprehensive job board and applicant tracking system (ATS) with role-based access control for SuperAdmins, Hiring Managers, and Candidates.

## Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript development
- **React Router 6** - Client-side routing with SPA navigation
- **Vite** - Fast development server and build tool
- **TailwindCSS 3** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **React Query (@tanstack/react-query)** - Server state management
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation

### Backend
- **Node.js** - JavaScript runtime
- **Express 5** - Web framework for API routes
- **TypeScript** - Type-safe server development
- **MySQL 8.0+** - Relational database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email sending for OTP

### Development Tools
- **PNPM** - Package manager (preferred over npm/yarn)
- **Vitest** - Unit testing framework
- **ESLint & Prettier** - Code quality and formatting
- **PostCSS** - CSS processing for Tailwind

## Project Structure

```
career-portal/
├── client/                     # React SPA frontend
├── server/                     # Express API backend
├── shared/                     # Shared TypeScript types
├── database/                   # Database schema and migrations
├── public/                     # Static assets
├── scripts/                    # Utility scripts
└── netlify/                    # Serverless functions for deployment
```

## Database Schema

The application uses MySQL with a comprehensive schema designed for a career portal:

### Core Tables

#### Users & Authentication
- **`users`** - User accounts with roles (SuperAdmin, HiringManager, Candidate)
- **`roles`** - User role definitions
- **`otp_codes`** - OTP verification for email verification

#### Candidate Data
- **`candidate_profiles`** - Detailed candidate information
- **`candidate_education`** - Educational background
- **`candidate_skills`** - Skill associations (junction table)
- **`candidate_achievements`** - Certifications, awards, etc.
- **`candidate_attachments`** - CVs, portfolios, photos

#### Job Management
- **`jobs`** - Job postings with full details
- **`job_form_fields`** - Dynamic form fields for applications
- **`job_form_field_options`** - Options for select/checkbox fields

#### Applications
- **`applications`** - Job applications with status tracking
- **`application_answers`** - Responses to custom form fields
- **`application_history`** - Status change audit trail
- **`application_ux_feedback`** - User experience feedback

#### Lookup Tables
- **`companies`** - Employer information
- **`departments`** - Organizational departments
- **`job_types`** - Full-time, part-time, contract, etc.
- **`experience_levels`** - Entry level to senior positions
- **`job_statuses`** - Draft, published, closed, etc.
- **`application_statuses`** - Applied, interview, offer, etc.
- **`skills`** - Skills library with approval workflow
- **`referral_sources`** - How candidates found the job
- **`achievement_types`** - Types of achievements

#### Location Data
- **`countries`** - Geographic countries
- **`cities`** - Cities within countries
- **`areas`** - Areas/neighborhoods within cities

## File Structure and Purpose

### Root Configuration Files

#### `package.json`
- **Purpose**: Defines project dependencies, scripts, and metadata
- **Why created**: Manages the full-stack application with both client and server dependencies
- **Key features**: PNPM package manager, build scripts for client/server, extensive UI and development dependencies

#### `tsconfig.json`
- **Purpose**: TypeScript configuration for the entire project
- **Why created**: Enables type checking and modern JavaScript features across client and server

#### `vite.config.ts`
- **Purpose**: Vite configuration for client-side development
- **Why created**: Fast development server with HMR for React components

#### `vite.config.server.ts`
- **Purpose**: Vite configuration for server-side build
- **Why created**: Bundles the Express server for production deployment

#### `tailwind.config.ts`
- **Purpose**: TailwindCSS configuration with custom theme
- **Why created**: Provides consistent design system and utility classes

#### `.env`
- **Purpose**: Environment variables for configuration
- **Why created**: Stores sensitive data like database credentials and JWT secrets

### Client Structure (`client/`)

#### `client/App.tsx`
- **Purpose**: Main React application entry point with routing configuration
- **Why created**: Defines all application routes and authentication boundaries
- **Key features**: Protected routes, role-based access, routing structure

#### `client/global.css`
- **Purpose**: Global styles and TailwindCSS imports
- **Why created**: Provides base styling, custom CSS variables, and theme configuration

#### `client/vite-env.d.ts`
- **Purpose**: Vite environment type definitions
- **Why created**: TypeScript support for Vite-specific features

#### Pages (`client/pages/`)
- **Purpose**: Route-level components representing different application views
- **Why created**: Organizes application by feature areas with clear separation

**Authentication Pages:**
- `Login.tsx` - User login form with social login options
- `Signup.tsx` - User registration with OTP verification

**Public Pages:**
- `Home.tsx` - Landing page and job search interface with all job listed
- `NotFound.tsx` - 404 error page
- `JobDetails.tsx` - Detailed job posting view

**Candidate Pages:**
- `ApplyJob.tsx` - Dynamic job application form
- `Profile.tsx` - Candidate profile management

**Admin Pages:**
- `Dashboard.tsx` - Hiring manager dashboard
- `CreateJob.tsx` - Job creation with custom forms
- `CandidateManagement.tsx` - Applicant management interface
- `JobsManagement.tsx` - Job posting management
- `ApplicationsManagement.tsx` - Application review and status updates

**Super Admin Pages:**
- `SuperAdminDashboard.tsx` - System overview and statistics
- `UserManagement.tsx` - User account administration
- `CreateUser.tsx` - User creation interface
- `AuditLog.tsx` - System activity tracking
- `SystemConfiguration.tsx` - System settings management
- `DataExport.tsx` - Data export functionality
- `SystemStats.tsx` - System statistics and analytics
- `SystemManagement.tsx` - System administration tools
- `LookupManagement.tsx` - Management of lookup data

#### Components (`client/components/`)
- **Purpose**: Reusable UI components organized by feature
- **Why created**: Promotes code reuse and maintainability

**UI Components (`client/components/ui/`):**
- Complete Radix UI component library (40+ components)
- **Purpose**: Accessible, customizable base components
- **Why created**: Provides consistent design system with accessibility features
- **Examples**: Button, Card, Dialog, Form, Table, etc.

**Feature Components:**
- `Header.tsx` - Application header with navigation
- `Footer.tsx` - Application footer
- `Layout.tsx` - Main layout wrapper
- `ProtectedRoute.tsx` - Authentication wrapper for routes

**Admin Components:**
- `SuperAdminLayout.tsx` - Admin-specific layout
- `SuperAdminNav.tsx` - Admin navigation menu

**Form Components:**
- `DynamicApplicationForm.tsx` - Renders custom job application forms
- `DynamicFormBuilder.tsx` - Builds custom forms for job postings

**Job Components:**
- `JobCard.tsx` - Job posting card display

#### Services (`client/services/`)
- **Purpose**: API client for backend communication
- **Why created**: Centralizes all API calls with type safety and error handling

`api.ts`:
- Complete API client with authentication
- Organized by feature (auth, jobs, applications, candidate, admin, lookup)
- Error handling and token management
- Type-safe requests/responses

#### Hooks (`client/hooks/`)
- **Purpose**: Custom React hooks for shared logic
- **Why created**: Encapsulates complex state and side effects

`useAuth.ts` - Authentication state management
`useToast.ts` - Toast notification system
`use-mobile.tsx` - Mobile detection utilities

#### Lib (`client/lib/`)
- **Purpose**: Utility functions and configurations
- **Why created**: Shared helper functions and configurations

`utils.ts` - General utility functions including `cn()` for class merging
`utils.spec.ts` - Test specifications for utilities

### Server Structure (`server/`)

#### `server/index.ts`
- **Purpose**: Main Express server setup and route configuration
- **Why created**: Centralizes server configuration, middleware, and route definitions
- **Key features**: CORS, JSON parsing, authentication middleware, database connection testing

#### Configuration (`server/config/`)
`database.ts`:
- **Purpose**: Database connection and configuration
- **Why created**: Manages MySQL connection pool and provides database utilities
- **Features**: Connection testing, query execution, connection management

#### Middleware (`server/middleware/`)
`auth.ts`:
- **Purpose**: Authentication and authorization middleware
- **Why created**: Protects routes and enforces role-based access control
- **Features**: JWT verification, role checking, optional authentication

#### Routes (`server/routes/`)
- **Purpose**: API route handlers organized by feature
- **Why created**: Separates concerns and maintains clean API structure

**Authentication Routes (`auth.ts`):**
- Login, signup, social login
- OTP verification and email validation
- Token validation and refresh

**Job Routes (`jobs.ts`):**
- CRUD operations for job postings
- Job statistics and filtering
- Form field management integration

**Application Routes (`applications.ts`):**
- Application submission and management
- Status updates and history tracking
- Feedback collection

**Candidate Routes (`candidate.ts`):**
- Profile management
- File uploads (CV, portfolio)
- Education, skills, achievements

**Admin Routes (`admin.ts`):**
- User management (SuperAdmin only)
- System statistics and configuration
- Audit logging and data export

**Lookup Routes (`lookup.ts`):**
- Static data management
- Skills library
- Companies, departments, etc.

**Demo Routes (`demo.ts`):**
- **Purpose**: Example API endpoint for testing
- **Why created**: Provides simple testing endpoint for development

#### Services (`server/services/`)
`authService.ts`:
- **Purpose**: Authentication business logic
- **Why created**: Encapsulates authentication-related operations
- **Features**: Password hashing, JWT generation, user validation

### Shared Structure (`shared/`)

#### `shared/api.ts`
- **Purpose**: TypeScript interfaces shared between client and server
- **Why created**: Ensures type safety across the full stack
- **Features**: Complete type definitions for all API requests/responses, database models, and business entities

### Database Structure (`database/`)

#### `schema.sql`
- **Purpose**: Complete MySQL database schema
- **Why created**: Defines all tables, relationships, indexes, and default data
- **Features**: Normalized design, foreign key constraints, performance indexes, default data seeding

#### Migration Scripts:
- `add-color-field.sql` - Database migration for adding color fields
- `add-industries-table.js` - Script to add industries table
- `create-otp-table.js` - Script to create OTP verification table

### Scripts (`scripts/`)
- **Purpose**: Utility scripts for database management and maintenance
- **Why created**: Automates common database operations

### Netlify (`netlify/`)
#### `netlify/functions/api.ts`
- **Purpose**: Serverless function wrapper for deployment
- **Why created**: Enables deployment to serverless platforms like Netlify

## API Architecture

### Authentication Flow
1. **Login**: Email/password → JWT token + user data
2. **Social Login**: OAuth (Google/LinkedIn) → JWT token
3. **OTP Verification**: Email OTP → Account verification
4. **Token Validation**: Bearer token → User context
5. **Role-Based Access**: JWT payload → Route protection

### API Design Patterns
- **RESTful design** with resource-based endpoints
- **Consistent error handling** with standardized error responses
- **Pagination support** for list endpoints
- **File upload support** with multipart/form-data
- **Query parameters** for filtering and searching

### Route Organization
- **Public routes**: `/api/auth/*`, `/api/ping`, `/api/demo`, `/api/lookup/*`
- **Protected routes**: Require valid JWT token
- **Role-restricted routes**: Require specific user roles
- **Admin routes**: SuperAdmin-only endpoints

## Security Features

### Authentication
- JWT-based stateless authentication
- Password hashing with bcryptjs
- Social login integration (Google, LinkedIn)
- Email verification with OTP

### Authorization
- Role-based access control (RBAC)
- Route-level protection
- Resource-level ownership checks

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- File upload validation and sanitization
- CORS configuration

## Performance Optimizations

### Database
- Optimized indexes for common queries
- Foreign key constraints for data integrity
- Connection pooling for efficient database usage

### Frontend
- Code splitting with React Router
- Lazy loading of components
- Efficient state management with React Query
- Optimistic updates for better UX

### Backend
- Efficient middleware ordering
- Request/response caching where appropriate
- Database query optimization

## Development Workflow

### Environment Setup
1. Install dependencies: `pnpm install`
2. Configure environment variables in `.env`
3. Set up MySQL database and run `schema.sql`
4. Start development server: `pnpm dev`

### Building for Production
1. Build client: `pnpm build:client`
2. Build server: `pnpm build:server`
3. Start production: `pnpm start`

### Testing
- Unit tests: `pnpm test`
- Type checking: `pnpm typecheck`
- Code formatting: `pnpm format.fix`

## Deployment Options

### Traditional Server
- Build and deploy to Node.js hosting
- Requires MySQL database
- Environment variables for configuration

### Serverless (Netlify/Vercel)
- Deploy with serverless functions
- Managed database service required
- Automatic scaling and CDN

### Docker Container
- Containerize the full application
- Database can be containerized or external
- Easy deployment to any cloud provider

## Key Features

### Multi-Role System
- **SuperAdmin**: Complete system administration
- **HiringManager**: Job posting and applicant management
- **Candidate**: Job search and application management

### Dynamic Forms
- Custom application forms per job
- Various field types (text, select, file, etc.)
- Form validation and required fields

### Comprehensive Tracking
- Application status workflow
- Audit logging for all changes
- User activity tracking

### Rich Candidate Profiles
- Detailed professional information
- Skills and endorsements
- Education and achievements
- File attachments (CV, portfolio)

### Advanced Job Management
- Rich job descriptions
- Multiple application stages
- Hiring manager assignment
- Company and department organization

## Future Enhancements

### Planned Features
- Email notifications for application updates
- Advanced analytics and reporting
- AI-powered resume parsing
- Interview scheduling system
- Video interview integration

### Technical Improvements
- Redis caching for performance
- Elasticsearch for advanced search
- Microservices architecture
- GraphQL API alternative
- Mobile application (React Native)

This architecture provides a solid foundation for a modern career portal with room for growth and enhancement. The modular design allows for easy maintenance and feature additions while maintaining code quality and security standards.
