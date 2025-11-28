# Career Portal - Full Stack Application

A comprehensive career portal application built with React + Express + TypeScript + MySQL, featuring dynamic job applications, candidate profiles, and role-based access control.

## 🚀 Features

### Core Functionality
- **User Authentication**: JWT-based login/signup with role management (SuperAdmin, HiringManager, Candidate)
- **Dynamic Job Creation**: Custom form builder for each job posting
- **Candidate Profiles**: Comprehensive profiles with skills, education, achievements, and file uploads
- **Application Tracking**: Full application lifecycle with status history and feedback system
- **Role-based Access**: Secure endpoints with proper authorization
- **Real-time Updates**: Application status changes with history tracking

### Technical Features
- **Type-safe API**: Shared TypeScript types between frontend and backend
- **Database Integration**: MySQL with comprehensive schema for career management
- **File Uploads**: Secure file handling for CVs, portfolios, and attachments
- **Modern UI**: TailwindCSS + Radix UI components
- **Hot Reload**: Development server with client and server hot reloading

## 🏗️ Architecture

```
career-portal/
├── client/                 # React SPA frontend
│   ├── pages/            # Route components
│   ├── components/        # Reusable UI components
│   ├── services/          # API client and utilities
│   └── hooks/             # Custom React hooks
├── server/                # Express API backend
│   ├── routes/            # API endpoint handlers
│   ├── services/          # Business logic layer
│   ├── middleware/        # Auth and validation
│   └── config/           # Database and server config
├── shared/                # Shared TypeScript types
└── database/              # Database schema and migrations
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router 6** - Client-side routing
- **TailwindCSS 3** - Styling
- **Radix UI** - Component library
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **MySQL 8.0+** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File uploads

### Development
- **PNPM** - Package manager
- **Vitest** - Testing framework
- **ESLint + Prettier** - Code quality

## 📋 Prerequisites

- **Node.js 18+**
- **MySQL 8.0+**
- **PNPM** (recommended) or npm/yarn
- **Git**

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd career-portal
pnpm install
```

### 2. Database Setup

#### Option A: Using phpMyAdmin (Recommended for Local Dev)

1. Open phpMyAdmin in your browser (usually `http://localhost/phpmyadmin`)
2. Create a new database named `augmex_career`
3. Import the schema file:
   - Click "Import" tab
   - Select `database/schema.sql` from the project
   - Click "Go" to import

#### Option B: Using MySQL CLI

```bash
mysql -u root -p
CREATE DATABASE augmex_career;
USE augmex_career;
SOURCE database/schema.sql;
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="mysql://root:@localhost:3306/augmex_career"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=8080
NODE_ENV="development"

# Client (for production)
VITE_API_URL="http://localhost:8080/api"
```

### 4. Start Development Server

```bash
pnpm dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/api/ping

## 📊 Database Schema

The application uses a comprehensive MySQL schema with the following key entities:

### Core Tables
- **users** - User accounts with role-based access
- **candidate_profiles** - Detailed candidate information
- **jobs** - Job postings with dynamic form fields
- **applications** - Job applications with tracking

### Supporting Tables
- **roles** - SuperAdmin, HiringManager, Candidate
- **companies, departments** - Organization data
- **skills, education, achievements** - Candidate qualifications
- **application_history** - Status change tracking
- **files** - Document management

### Key Features
- **Soft Deletes** - Data preservation with `deleted_at` timestamps
- **Audit Trail** - Complete history of application status changes
- **Dynamic Forms** - Custom application questions per job
- **File Management** - Secure file uploads with metadata

## 🔐 Authentication & Authorization

### JWT-based Authentication
- Secure token-based authentication
- Role-based access control
- Token refresh mechanism
- Social login support (Google, LinkedIn)

### Role Permissions
- **SuperAdmin**: Full system access, user management
- **HiringManager**: Job management, application review
- **Candidate**: Profile management, job applications

## 📝 API Documentation

### Authentication Endpoints
```
POST /api/auth/login      - User login
POST /api/auth/signup     - User registration
POST /api/auth/social     - Social login
GET  /api/auth/validate  - Token validation
POST /api/auth/refresh   - Token refresh
```

### Job Management
```
GET    /api/jobs           - List jobs with filters
GET    /api/jobs/:id       - Get job details
POST   /api/jobs           - Create job (auth required)
PUT    /api/jobs/:id       - Update job (auth required)
DELETE /api/jobs/:id       - Delete job (admin only)
```

### Applications
```
GET    /api/applications           - List applications (auth required)
POST   /api/applications           - Submit application (auth required)
GET    /api/applications/:id       - Get application details
PUT    /api/applications/:id/status - Update status (manager/admin)
POST   /api/applications/:id/feedback - Submit feedback
```

### Candidate Profile
```
GET    /api/candidate/profile      - Get my profile (auth required)
PUT    /api/candidate/profile      - Update profile (auth required)
POST   /api/candidate/education   - Add education
POST   /api/candidate/skills       - Add skills
POST   /api/candidate/upload       - Upload files
```

## 🎨 Frontend Components

### UI Structure
- **Pages**: Route-level components (Home, Jobs, Profile, Dashboard)
- **Components**: Reusable UI elements (Forms, Cards, Modals)
- **Services**: API integration and state management
- **Hooks**: Custom React hooks for common functionality

### Key Components
- **DynamicApplicationForm** - Renders job-specific application forms
- **ProtectedRoute** - Route guard for authenticated users
- **JobCard** - Job listing display
- **ApplicationStatusTracker** - Visual status progress

## 🧪 Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm typecheck

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

## 🚀 Production Deployment

### Build Application
```bash
pnpm build
```

### Environment Setup
1. Set production environment variables
2. Configure production database
3. Build the application
4. Deploy to your hosting platform

### Deployment Options
- **Netlify/Vercel** - Static frontend + serverless functions
- **Traditional VPS** - Full Node.js application
- **Docker** - Containerized deployment

## 🔧 Configuration

### Environment Variables
```env
# Database Connection
DATABASE_URL="mysql://user:password@host:port/database"

# JWT Configuration
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Server Settings
PORT=8080
NODE_ENV="production"

# Client API URL
VITE_API_URL="https://your-domain.com/api"
```

### Database Configuration
- MySQL 8.0+ recommended
- Connection pooling enabled
- Optimized indexes for performance
- Foreign key constraints for data integrity

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MySQL service
sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SELECT 1"
```

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :8080

# Kill process if needed
sudo kill -9 <PID>
```

#### Module Resolution
```bash
# Clear node modules
rm -rf node_modules
pnpm install
```

### Debug Mode
Set `DEBUG=*` environment variable for detailed logging:

```bash
DEBUG=* pnpm dev
```

## 📈 Performance

### Database Optimizations
- Indexed columns for frequent queries
- Connection pooling (max 10 connections)
- Query optimization with proper JOINs
- Soft deletes for data preservation

### Frontend Optimizations
- Code splitting with React Router
- Lazy loading for large components
- Image optimization and CDN usage
- Bundle size optimization

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with proper typing
4. Add tests for new functionality
5. Submit pull request

### Code Standards
- TypeScript strict mode enabled
- ESLint + Prettier formatting
- Comprehensive error handling
- Security-first approach

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the database schema
3. Verify environment configuration
4. Check API endpoint responses

---

**Built with ❤️ using modern web technologies**
