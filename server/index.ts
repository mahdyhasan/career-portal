import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleLogin, handleSignup, handleSocialLogin, handleValidateToken, handleRefreshToken, handleSendOTP, handleVerifyOTP, handleSignupWithOTP } from "./routes/auth";
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
  handleCreateSkill
} from "./routes/lookup";
import { 
  handleGetUsers, 
  handleUpdateUserStatus, 
  handleUpdateUserRole, 
  handleGetSystemStats, 
  handleGetSystemConfig, 
  handleGetAuditLog, 
  handleExportData 
} from "./routes/admin";
import { 
  handleGetProfile, 
  handleUpdateProfile, 
  handleUploadFile,
  handleAddSkill,
  handleRemoveSkill,
  handleWithdrawApplication
} from "./routes/candidate";
import { 
  handleGetApplications, 
  handleGetApplication, 
  handleSubmitApplication, 
  handleUpdateApplicationStatus, 
  handleGetApplicationStats 
} from "./routes/applications";
import { authenticateToken, optionalAuth, requireRole } from "./middleware/auth";
import { testConnection } from "./config/database";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
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

  // Job routes
  app.get("/api/jobs", handleGetJobs);
  app.get("/api/jobs/:id", handleGetJob);
  app.post("/api/jobs", authenticateToken, requireRole(['SuperAdmin', 'HiringManager']), handleCreateJob);
  app.put("/api/jobs/:id", authenticateToken, handleUpdateJob);
  app.delete("/api/jobs/:id", authenticateToken, handleDeleteJob);
  app.get("/api/jobs/stats", authenticateToken, handleGetJobStats);

  // Candidate routes
  app.get("/api/candidate/profile", authenticateToken, handleGetProfile);
  app.put("/api/candidate/profile", authenticateToken, handleUpdateProfile);
  app.post("/api/candidate/upload", authenticateToken, handleUploadFile);
  app.post("/api/candidate/skills", authenticateToken, handleAddSkill);
  app.delete("/api/candidate/skills/:skillId", authenticateToken, handleRemoveSkill);
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
  app.post("/api/lookup/skills", authenticateToken, handleCreateSkill);

  // Super Admin routes
  app.get("/api/admin/users", authenticateToken, requireRole(['SuperAdmin']), handleGetUsers);
  app.put("/api/admin/users/:id/status", authenticateToken, requireRole(['SuperAdmin']), handleUpdateUserStatus);
  app.put("/api/admin/users/:id/role", authenticateToken, requireRole(['SuperAdmin']), handleUpdateUserRole);
  app.get("/api/admin/stats", authenticateToken, requireRole(['SuperAdmin']), handleGetSystemStats);
  app.get("/api/admin/config", authenticateToken, requireRole(['SuperAdmin']), handleGetSystemConfig);
  app.get("/api/admin/audit-log", authenticateToken, requireRole(['SuperAdmin']), handleGetAuditLog);
  app.get("/api/admin/export", authenticateToken, requireRole(['SuperAdmin']), handleExportData);

  return app;
}
