import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleLogin, handleSignup, handleSocialLogin, handleValidateToken, handleRefreshToken } from "./routes/auth";
import { handleGetJobs, handleGetJob, handleCreateJob, handleUpdateJob, handleDeleteJob, handleGetJobStats } from "./routes/jobs";
import { 
  handleGetUsers, 
  handleUpdateUserStatus, 
  handleUpdateUserRole, 
  handleGetSystemStats, 
  handleGetSystemConfig, 
  handleGetAuditLog, 
  handleExportData 
} from "./routes/admin";
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
  app.get("/api/auth/validate", authenticateToken, handleValidateToken);
  app.post("/api/auth/refresh", authenticateToken, handleRefreshToken);

  // Job routes
  app.get("/api/jobs", handleGetJobs);
  app.get("/api/jobs/:id", handleGetJob);
  app.post("/api/jobs", authenticateToken, handleCreateJob);
  app.put("/api/jobs/:id", authenticateToken, handleUpdateJob);
  app.delete("/api/jobs/:id", authenticateToken, handleDeleteJob);
  app.get("/api/jobs/stats", authenticateToken, handleGetJobStats);

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
