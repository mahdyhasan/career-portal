// server/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleLogin, handleSignup, handleSocialLogin, handleValidateToken, handleRefreshToken, handleSendOTP, handleVerifyOTP, handleSignupWithOTP, handleLogout } from "./routes/auth";
import { handleGetJobs, handleGetJob, handleCreateJob, handleUpdateJob, handleDeleteJob, handleGetJobStats } from "./routes/jobs";
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
import { authenticateToken, optionalAuth, requireRole, requireAnyRole } from "./middleware/auth";
import { requireJobManagement } from "./middleware/checkRole";
import { testConnection } from "./config/database";

export function createServer() {
  const app = express();

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
  app.delete("/api/jobs/:id", authenticateToken, requireAnyRole(['SuperAdmin']), handleDeleteJob);
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
  app.get("/api/users", authenticateToken, requireAnyRole(['SuperAdmin']), handleGetAllUsers);
  app.get("/api/users/:id", authenticateToken, requireAnyRole(['SuperAdmin']), handleGetUser);
  app.post("/api/users", authenticateToken, requireAnyRole(['SuperAdmin']), handleCreateNewUser);
  app.put("/api/users/:id/status", authenticateToken, requireAnyRole(['SuperAdmin']), handleUpdateUserStatusRoute);
  app.put("/api/users/:id/role", authenticateToken, requireAnyRole(['SuperAdmin']), handleUpdateUserRoleRoute);
  app.delete("/api/users/:id", authenticateToken, requireAnyRole(['SuperAdmin']), handleDeleteUser);

  // Super Admin routes
  app.get("/api/admin/users", authenticateToken, requireAnyRole(['SuperAdmin']), handleGetUsers);
  app.post("/api/admin/users", authenticateToken, requireAnyRole(['SuperAdmin']), handleCreateUser);
  app.put("/api/admin/users/:id/status", authenticateToken, requireAnyRole(['SuperAdmin']), handleUpdateUserStatus);
  app.put("/api/admin/users/:id/role", authenticateToken, requireAnyRole(['SuperAdmin']), handleUpdateUserRole);
  app.get("/api/admin/stats", authenticateToken, requireAnyRole(['SuperAdmin']), handleGetSystemStats);
  app.get("/api/admin/config", authenticateToken, requireAnyRole(['SuperAdmin']), handleGetSystemConfig);
  app.get("/api/admin/audit-log", authenticateToken, requireAnyRole(['SuperAdmin']), handleGetAuditLog);
  app.get("/api/admin/export", authenticateToken, requireAnyRole(['SuperAdmin']), handleExportData);

  return app;
}
