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
import JobDetails from "./pages/jobs/JobDetails";
import ApplyJob from "./pages/candidate/ApplyJob";
import CandidateProfile from "./pages/candidate/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCreateJob from "./pages/admin/CreateJob";
import AdminCandidateManagement from "./pages/admin/CandidateManagement";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import JobsManagement from "./pages/admin/JobsManagement";
import ApplicationsManagement from "./pages/admin/ApplicationsManagement";
import SystemManagement from "./pages/admin/SystemManagement";
import LookupManagement from "./pages/admin/LookupManagement";
import CreateUser from "./pages/admin/CreateUser";

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
          <Route path="/candidate/my-applications" element={
            <ProtectedRoute requireRole="Candidate">
              <CandidateProfile />
            </ProtectedRoute>
          } />
          
          {/* Hiring Manager Routes - Protected */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requireRole="HiringManager">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/create-job" element={
            <ProtectedRoute requireRole={["HiringManager", "SuperAdmin"]}>
              <AdminCreateJob />
            </ProtectedRoute>
          } />
          <Route path="/admin/candidates" element={
            <ProtectedRoute requireRole={["HiringManager", "SuperAdmin"]}>
              <AdminCandidateManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/jobs" element={
            <ProtectedRoute requireRole={["HiringManager", "SuperAdmin"]}>
              <JobsManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/applications" element={
            <ProtectedRoute requireRole={["HiringManager", "SuperAdmin"]}>
              <ApplicationsManagement />
            </ProtectedRoute>
          } />
          
          {/* Super Admin Only Routes - Protected */}
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
          <Route path="/admin/users/create" element={
            <ProtectedRoute requireRole="SuperAdmin">
              <CreateUser />
            </ProtectedRoute>
          } />
          <Route path="/admin/system" element={
            <ProtectedRoute requireRole="SuperAdmin">
              <SystemManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/lookup" element={
            <ProtectedRoute requireRole="SuperAdmin">
              <LookupManagement />
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
