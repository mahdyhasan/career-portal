import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import SystemConfig from "./pages/admin/SystemConfig";
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
          
          {/* Candidate Routes */}
          <Route path="/apply/:jobId" element={<ApplyJob />} />
          <Route path="/profile" element={<CandidateProfile />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/create-job" element={<AdminCreateJob />} />
          <Route path="/admin/candidates" element={<AdminCandidateManagement />} />
          
          {/* Super Admin Routes */}
          <Route path="/admin/super-dashboard" element={<SuperAdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/audit-log" element={<AuditLog />} />
          <Route path="/admin/config" element={<SystemConfig />} />
          <Route path="/admin/export" element={<DataExport />} />
          <Route path="/admin/stats" element={<SystemStats />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
