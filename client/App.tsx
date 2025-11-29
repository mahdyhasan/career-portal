import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Components
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import JobsList from "./pages/jobs/JobsList";
import JobDetails from "./pages/jobs/JobDetails";
import ApplyJob from "./pages/candidate/ApplyJob";
import CandidateProfile from "./pages/candidate/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCreateJob from "./pages/admin/CreateJob";
import AdminCandidateManagement from "./pages/admin/CandidateManagement";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AuditLog from "./pages/admin/AuditLog";
import SystemConfiguration from "./pages/admin/SystemConfiguration";
import DataExport from "./pages/admin/DataExport";
import SystemStats from "./pages/admin/SystemStats";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Job Routes */}
          <Route path="/jobs" element={<JobsList />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          
          {/* Candidate Routes - Protected */}
          <Route path="/apply/:jobId" element={
            <ProtectedRoute requireRole="Candidate">
              <ApplyJob />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute requireRole="Candidate">
              <CandidateProfile />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes - Protected */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requireRole="HiringManager">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/create-job" element={
            <ProtectedRoute requireRole="HiringManager">
              <AdminCreateJob />
            </ProtectedRoute>
          } />
          <Route path="/admin/candidates" element={
            <ProtectedRoute requireRole="HiringManager">
              <AdminCandidateManagement />
            </ProtectedRoute>
          } />
          
          {/* Super Admin Routes - Protected */}
          <Route path="/admin/super-dashboard" element={
            <ProtectedRoute requireRole="SuperAdmin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireRole="SuperAdmin">
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-log" element={
            <ProtectedRoute requireRole="SuperAdmin">
              <AuditLog />
            </ProtectedRoute>
          } />
          <Route path="/admin/config" element={
            <ProtectedRoute requireRole="SuperAdmin">
              <SystemConfiguration />
            </ProtectedRoute>
          } />
          <Route path="/admin/export" element={
            <ProtectedRoute requireRole="SuperAdmin">
              <DataExport />
            </ProtectedRoute>
          } />
          <Route path="/admin/stats" element={
            <ProtectedRoute requireRole="SuperAdmin">
              <SystemStats />
            </ProtectedRoute>
          } />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
