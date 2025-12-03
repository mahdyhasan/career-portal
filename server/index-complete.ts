// server/index-complete.ts - Complete server with all advanced features
import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer as createHTTPServer } from "http";
import { Server } from "socket.io";

// Import all route handlers
import { handleDemo } from "./routes/demo";
import { 
  handleLogin, 
  handleSignup, 
  handleSocialLogin, 
  handleValidateToken, 
  handleRefreshToken, 
  handleSendOTP, 
  handleVerifyOTP, 
  handleSignupWithOTP, 
  handleLogout 
} from "./routes/auth";

import { 
  handleGetJobs, 
  handleGetJob, 
  handleCreateJob, 
  handleUpdateJob, 
  handleDeleteJob, 
  handleGetJobStats 
} from "./routes/jobs";

import { 
  handleGetJobStatuses,
  handleGetJobTypes,
  handleGetExperienceLevels,
  handleGetCompanies,
  handleGetDepartments,
  handleGetApplicationStatuses,
  handleGetSkills,
  handleGetIndustries,
  handleGetCountries,
  handleGetCities,
  handleGetAreas,
  handleCreateSkill
} from "./routes/lookup";

import { 
  handleGetUsers, 
  handleCreateUser,
  handleUpdateUserStatus, 
  handleUpdateUserRole, 
  handleGetSystemStats, 
  handleGetSystemConfig, 
  handleGetAuditLog, 
  handleExportData 
} from "./routes/admin";

import { 
  handleGetUsers as handleGetAllUsers,
  handleGetUser,
  handleCreateUser as handleCreateNewUser,
  handleUpdateUserStatus as handleUpdateUserStatusRoute,
  handleUpdateUserRole as handleUpdateUserRoleRoute,
  handleDeleteUser
} from "./routes/users";

import { 
  handleGetProfile, 
  handleUpdateProfile, 
  handleUploadFile,
  handleAddSkill,
  handleRemoveSkill,
  handleAddEducation,
  handleUpdateEducation,
  handleDeleteEducation,
  handleAddAchievement,
  handleUpdateAchievement,
  handleDeleteAchievement
} from "./routes/candidate";

import { 
  handleGetApplications, 
  handleGetApplication, 
  handleSubmitApplication, 
  handleUpdateApplicationStatus, 
  handleGetApplicationStats,
  handleWithdrawApplication
} from "./routes/applications";

// Import new advanced feature routes
import {
  handleUpdateApplicationStatus as handleWorkflowUpdateStatus,
  handleScheduleInterview,
  handleUpdateInterviewStatus,
  handleMakeJobOffer,
  handleRespondToOffer,
  handleGetApplicationWorkflowHistory,
  handleGetUpcomingInterviews
} from "./routes/applicationWorkflow";

import {
  handleGetSystemAnalytics,
  handleGetJobAnalytics,
  handleGetUserAnalytics,
  handleGetDashboardStats,
  handleExportAnalytics
} from "./routes/analytics";

import {
  handleSearchJobs,
  handleSearchCandidates,
  handleSearchApplications,
  handleGetSearchSuggestions,
  handleGetFilterOptions
} from "./routes/search";

import {
  handleCreateUser as handleAdminCreateUser,
  handleUpdateUser,
  handleDeleteUser as handleAdminDeleteUser,
  handleGetSystemStats as handleAdminSystemStats,
  handleGetAuditLog as handleGetAuditLogs
} from "./routes/admin";

import {
  handleGetNotifications,
  handleMarkNotificationAsRead,
  handleMarkAllNotificationsAsRead,
  handleGetUnreadCount
} from "./routes/notifications";

import { authenticateToken, optionalAuth, requireRole, requireAnyRole } from "./middleware/auth";
import { requireJobManagement } from "./middleware/checkRole";
import { testConnection } from "./config/database";
import { NotificationService } from "./services/notificationService";

export function createServer() {
  const app = express();
  const httpServer = createHTTPServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : true,
      credentials: true
    }
  });

  // Initialize notification service with socket.io
  NotificationService.initialize(io);

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join_user_room', (userId: number) => {
      NotificationService.handleUserConnection(socket, userId);
    });
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : true,
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Test database connection on startup
  testConnection();

  // Public API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes (public)
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/social", handleSocialLogin);
  app.post("/api/auth/send-otp", handleSendOTP);
  app.post("/api/auth/verify-otp", handleVerifyOTP);
  app.post("/api/auth/signup-with-otp", handleSignupWithOTP);
  app.get("/api/auth/validate", authenticateToken, handleValidateToken);
  app.post("/api/auth/refresh", authenticateToken, handleRefreshToken);
  app.post("/api/auth/logout", authenticateToken, handleLogout);

  // Job routes
  app.get("/api/jobs", handleGetJobs);
  app.get("/api/jobs/:id", handleGetJob);
  app.post("/api/jobs", authenticateToken, requireJobManagement, handleCreateJob);
  app.put("/api/jobs/:id", authenticateToken, handleUpdateJob);
  app.delete("/api/jobs/:id", authenticateToken, requireRole('SuperAdmin'), handleDeleteJob);
  app.get("/api/jobs/stats", authenticateToken, handleGetJobStats);

  // Candidate routes
  app.get("/api/candidate/profile", authenticateToken, handleGetProfile);
  app.put("/api/candidate/profile", authenticateToken, handleUpdateProfile);
  app.post("/api/candidate/upload", authenticateToken, handleUploadFile);
  app.post("/api/candidate/skills", authenticateToken, handleAddSkill);
  app.delete("/api/candidate/skills/:skillId", authenticateToken, handleRemoveSkill);
  app.post("/api/candidate/education", authenticateToken, handleAddEducation);
  app.put("/api/candidate/education/:id", authenticateToken, handleUpdateEducation);
  app.delete("/api/candidate/education/:id", authenticateToken, handleDeleteEducation);
  app.post("/api/candidate/achievements", authenticateToken, handleAddAchievement);
  app.put("/api/candidate/achievements/:id", authenticateToken, handleUpdateAchievement);
  app.delete("/api/candidate/achievements/:id", authenticateToken, handleDeleteAchievement);
  app.delete("/api/applications/:applicationId/withdraw", authenticateToken, handleWithdrawApplication);

  // Application routes
  app.get("/api/applications", authenticateToken, handleGetApplications);
  app.get("/api/applications/:id", authenticateToken, handleGetApplication);
  app.post("/api/applications", authenticateToken, handleSubmitApplication);
  app.put("/api/applications/:id/status", authenticateToken, handleUpdateApplicationStatus);
  app.get("/api/applications/stats", authenticateToken, handleGetApplicationStats);

  // Lookup routes (public)
  app.get("/api/lookup/job-statuses", handleGetJobStatuses);
  app.get("/api/lookup/job-types", handleGetJobTypes);
  app.get("/api/lookup/experience-levels", handleGetExperienceLevels);
  app.get("/api/lookup/companies", handleGetCompanies);
  app.get("/api/lookup/departments", handleGetDepartments);
  app.get("/api/lookup/application-statuses", handleGetApplicationStatuses);
  app.get("/api/lookup/skills", handleGetSkills);
  app.get("/api/lookup/industries", handleGetIndustries);
  app.get("/api/lookup/countries", handleGetCountries);
  app.get("/api/lookup/cities", handleGetCities);
  app.get("/api/lookup/areas", handleGetAreas);
  app.post("/api/lookup/skills", authenticateToken, handleCreateSkill);

  // User Management routes (SuperAdmin only)
  app.get("/api/users", authenticateToken, requireRole('SuperAdmin'), handleGetAllUsers);
  app.get("/api/users/:id", authenticateToken, requireRole('SuperAdmin'), handleGetUser);
  app.post("/api/users", authenticateToken, requireRole('SuperAdmin'), handleCreateNewUser);
  app.put("/api/users/:id/status", authenticateToken, requireRole('SuperAdmin'), handleUpdateUserStatusRoute);
  app.put("/api/users/:id/role", authenticateToken, requireRole('SuperAdmin'), handleUpdateUserRoleRoute);
  app.delete("/api/users/:id", authenticateToken, requireRole('SuperAdmin'), handleDeleteUser);

  // Super Admin routes
  app.get("/api/admin/users", authenticateToken, requireRole('SuperAdmin'), handleGetUsers);
  app.post("/api/admin/users", authenticateToken, requireRole('SuperAdmin'), handleCreateUser);
  app.put("/api/admin/users/:id/status", authenticateToken, requireRole('SuperAdmin'), handleUpdateUserStatus);
  app.put("/api/admin/users/:id/role", authenticateToken, requireRole('SuperAdmin'), handleUpdateUserRole);
  app.get("/api/admin/stats", authenticateToken, requireRole('SuperAdmin'), handleGetSystemStats);
  app.get("/api/admin/config", authenticateToken, requireRole('SuperAdmin'), handleGetSystemConfig);
  app.get("/api/admin/audit-log", authenticateToken, requireRole('SuperAdmin'), handleGetAuditLog);
  app.get("/api/admin/export", authenticateToken, requireRole('SuperAdmin'), handleExportData);

  // ===== NEW ADVANCED FEATURE ROUTES =====

  // Application Workflow Routes
  app.put("/api/workflow/applications/:applicationId/status", authenticateToken, handleWorkflowUpdateStatus);
  app.post("/api/workflow/interviews", authenticateToken, handleScheduleInterview);
  app.put("/api/workflow/interviews/:interviewId/status", authenticateToken, handleUpdateInterviewStatus);
  app.post("/api/workflow/offers", authenticateToken, handleMakeJobOffer);
  app.put("/api/workflow/offers/:offerId/response", authenticateToken, handleRespondToOffer);
  app.get("/api/workflow/applications/:applicationId/history", authenticateToken, handleGetApplicationWorkflowHistory);
  app.get("/api/workflow/upcoming-interviews", authenticateToken, handleGetUpcomingInterviews);

  // Analytics Routes
  app.get("/api/analytics/system", authenticateToken, handleGetSystemAnalytics);
  app.get("/api/analytics/jobs/:jobId", authenticateToken, handleGetJobAnalytics);
  app.get("/api/analytics/users/:userId", authenticateToken, handleGetUserAnalytics);
  app.get("/api/analytics/dashboard", authenticateToken, handleGetDashboardStats);
  app.get("/api/analytics/export", authenticateToken, handleExportAnalytics);

  // Search Routes
  app.get("/api/search/jobs", authenticateToken, handleSearchJobs);
  app.get("/api/search/candidates", authenticateToken, requireAnyRole(['SuperAdmin', 'HiringManager']), handleSearchCandidates);
  app.get("/api/search/applications", authenticateToken, requireAnyRole(['SuperAdmin', 'HiringManager']), handleSearchApplications);
  app.get("/api/search/suggestions", authenticateToken, handleGetSearchSuggestions);
  app.get("/api/search/filters", authenticateToken, handleGetFilterOptions);

  // Admin Management Routes - commented out non-existent handlers
  // app.get("/api/admin/settings", authenticateToken, requireRole('SuperAdmin'), handleGetSystemSettings);
  // app.put("/api/admin/settings", authenticateToken, requireRole('SuperAdmin'), handleUpdateSystemSettings);
  app.post("/api/admin/users/create", authenticateToken, requireRole('SuperAdmin'), handleAdminCreateUser);
  app.put("/api/admin/users/:userId", authenticateToken, requireRole('SuperAdmin'), handleUpdateUser);
  app.delete("/api/admin/users/:userId", authenticateToken, requireRole('SuperAdmin'), handleAdminDeleteUser);
  // app.post("/api/admin/reference/:table/:action", authenticateToken, requireRole('SuperAdmin'), handleManageReferenceData);
  app.get("/api/admin/system-stats", authenticateToken, requireRole('SuperAdmin'), handleAdminSystemStats);
  app.get("/api/admin/audit-logs", authenticateToken, requireRole('SuperAdmin'), handleGetAuditLogs);
  // app.post("/api/admin/backup", authenticateToken, requireRole('SuperAdmin'), handleBackupDatabase);
  // app.get("/api/admin/health", authenticateToken, requireRole('SuperAdmin'), handleGetSystemHealth);

  // Notification Routes
  app.get("/api/notifications", authenticateToken, handleGetNotifications);
  app.put("/api/notifications/:notificationId/read", authenticateToken, handleMarkNotificationAsRead);
  app.put("/api/notifications/mark-all-read", authenticateToken, handleMarkAllNotificationsAsRead);
  app.get("/api/notifications/unread-count", authenticateToken, handleGetUnreadCount);

  return { app, httpServer, io };
}
