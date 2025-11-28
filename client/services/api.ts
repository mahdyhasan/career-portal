/**
 * Real API service for communicating with the backend
 * Replaces mock data with actual database operations
 */

import {
  User,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  Job,
  Application,
  CandidateProfile,
  PaginatedResponse,
  JobFilters,
  CandidateFilters,
  ApplicationStatus,
  JobStatus,
  JobType,
  ExperienceLevel,
  Company,
  Department,
  Skill,
  SkillsListResponse,
  SubmitApplicationRequest,
  UpdateApplicationStatusRequest,
  ApplicationFeedbackRequest,
  CandidateEducationRequest,
  CandidateAchievementRequest,
  CandidateSkillRequest,
  CreateJobRequest
} from '@shared/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class ApiError extends Error {
  constructor(
    public message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic request wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Request failed',
        data.code || 'REQUEST_FAILED',
        data.details
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      'NETWORK_ERROR'
    );
  }
}

// Authenticated request wrapper
async function authenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new ApiError('Authentication required', 'AUTH_REQUIRED');
  }

  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

// ==========================================
// AUTHENTICATION API
// ==========================================

export const authApi = {
  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Signup
  async signup(userData: SignupRequest): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Social login
  async socialLogin(provider: string, token: string, profile?: any): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/auth/social', {
      method: 'POST',
      body: JSON.stringify({ provider, token, profile }),
    });
  },

  // Validate token
  async validateToken(): Promise<{ valid: boolean; user: any }> {
    return authenticatedRequest('/auth/validate');
  },

  // Refresh token
  async refreshToken(): Promise<{ token: string; user: any }> {
    return authenticatedRequest('/auth/refresh', {
      method: 'POST',
    });
  },
};

// ==========================================
// JOBS API
// ==========================================

export const jobsApi = {
  // Get all jobs with filters and pagination
  async getJobs(
    page = 1,
    limit = 10,
    filters: JobFilters = {}
  ): Promise<PaginatedResponse<Job>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      ),
    });

    return apiRequest<PaginatedResponse<Job>>(`/jobs?${params}`);
  },

  // Get job by ID with form fields
  async getJob(id: number): Promise<Job> {
    return apiRequest<Job>(`/jobs/${id}`);
  },

  // Create new job (HiringManager/SuperAdmin only)
  async createJob(jobData: CreateJobRequest): Promise<Job> {
    return authenticatedRequest<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Update job (HiringManager/SuperAdmin only)
  async updateJob(id: number, jobData: Partial<Job>): Promise<Job> {
    return authenticatedRequest<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },

  // Delete job (SuperAdmin only)
  async deleteJob(id: number): Promise<void> {
    return authenticatedRequest<void>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  // Get job statistics (for dashboard)
  async getJobStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    closed: number;
  }> {
    return authenticatedRequest('/jobs/stats');
  },
};

// ==========================================
// APPLICATIONS API
// ==========================================

export const applicationsApi = {
  // Get applications (for candidates and admins)
  async getApplications(
    page = 1,
    limit = 10,
    filters: CandidateFilters = {}
  ): Promise<PaginatedResponse<Application>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      ),
    });

    return authenticatedRequest<PaginatedResponse<Application>>(`/applications?${params}`);
  },

  // Get application by ID
  async getApplication(id: number): Promise<Application> {
    return authenticatedRequest<Application>(`/applications/${id}`);
  },

  // Submit application
  async submitApplication(
    applicationData: SubmitApplicationRequest
  ): Promise<Application> {
    return authenticatedRequest<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  // Update application status (HiringManager/SuperAdmin only)
  async updateApplicationStatus(
    id: number,
    statusData: UpdateApplicationStatusRequest
  ): Promise<Application> {
    return authenticatedRequest<Application>(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  },

  // Submit UX feedback (after application submission)
  async submitFeedback(
    id: number,
    feedbackData: ApplicationFeedbackRequest
  ): Promise<void> {
    return authenticatedRequest<void>(`/applications/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  },

  // Get application statistics
  async getApplicationStats(): Promise<{
    total: number;
    applied: number;
    underReview: number;
    interview: number;
    offer: number;
    rejected: number;
  }> {
    return authenticatedRequest('/applications/stats');
  },
};

// ==========================================
// CANDIDATE PROFILE API
// ==========================================

export const candidateApi = {
  // Get my profile
  async getMyProfile(): Promise<CandidateProfile> {
    return authenticatedRequest<CandidateProfile>('/candidate/profile');
  },

  // Update my profile
  async updateProfile(
    profileData: Partial<CandidateProfile>
  ): Promise<CandidateProfile> {
    return authenticatedRequest<CandidateProfile>('/candidate/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Add education
  async addEducation(
    educationData: CandidateEducationRequest
  ): Promise<any> {
    return authenticatedRequest('/candidate/education', {
      method: 'POST',
      body: JSON.stringify(educationData),
    });
  },

  // Update education
  async updateEducation(
    id: number,
    educationData: Partial<CandidateEducationRequest>
  ): Promise<any> {
    return authenticatedRequest(`/candidate/education/${id}`, {
      method: 'PUT',
      body: JSON.stringify(educationData),
    });
  },

  // Delete education
  async deleteEducation(id: number): Promise<void> {
    return authenticatedRequest(`/candidate/education/${id}`, {
      method: 'DELETE',
    });
  },

  // Add achievement
  async addAchievement(
    achievementData: CandidateAchievementRequest
  ): Promise<any> {
    return authenticatedRequest('/candidate/achievements', {
      method: 'POST',
      body: JSON.stringify(achievementData),
    });
  },

  // Update achievement
  async updateAchievement(
    id: number,
    achievementData: Partial<CandidateAchievementRequest>
  ): Promise<any> {
    return authenticatedRequest(`/candidate/achievements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(achievementData),
    });
  },

  // Delete achievement
  async deleteAchievement(id: number): Promise<void> {
    return authenticatedRequest(`/candidate/achievements/${id}`, {
      method: 'DELETE',
    });
  },

  // Add skill
  async addSkill(skillData: CandidateSkillRequest): Promise<any> {
    return authenticatedRequest('/candidate/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  },

  // Remove skill
  async removeSkill(skillId: number): Promise<void> {
    return authenticatedRequest(`/candidate/skills/${skillId}`, {
      method: 'DELETE',
    });
  },

  // Upload file (CV, Portfolio, etc.)
  async uploadFile(
    file: File,
    fileType: 'CV' | 'Portfolio' | 'Photo' | 'Other'
  ): Promise<{ file_url: string; file_size_kb: number; mime_type: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new ApiError('Authentication required', 'AUTH_REQUIRED');
    }

    const response = await fetch(`${API_BASE_URL}/candidate/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Upload failed',
        data.code || 'UPLOAD_FAILED'
      );
    }

    return data;
  },
};

// ==========================================
// ADMIN API
// ==========================================

export const adminApi = {
  // Get all users (SuperAdmin only)
  async getUsers(
    page = 1,
    limit = 10,
    search?: string
  ): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    return authenticatedRequest<PaginatedResponse<User>>(`/admin/users?${params}`);
  },

  // Deactivate user (SuperAdmin only)
  async deactivateUser(userId: number): Promise<void> {
    return authenticatedRequest(`/admin/users/${userId}/deactivate`, {
      method: 'PUT',
    });
  },

  // Activate user (SuperAdmin only)
  async activateUser(userId: number): Promise<void> {
    return authenticatedRequest(`/admin/users/${userId}/activate`, {
      method: 'PUT',
    });
  },

  // Get system statistics (SuperAdmin only)
  async getSystemStats(): Promise<{
    users: { total: number; active: number; candidates: number; managers: number; admins: number };
    jobs: { total: number; published: number; draft: number; closed: number };
    applications: { total: number; pending: number; approved: number; rejected: number };
    skills: { total: number; approved: number; pending: number };
  }> {
    return authenticatedRequest('/admin/stats');
  },
};

// ==========================================
// LOOKUP DATA API
// ==========================================

export const lookupApi = {
  // Get job statuses
  async getJobStatuses(): Promise<JobStatus[]> {
    return apiRequest<JobStatus[]>('/lookup/job-statuses');
  },

  // Get job types
  async getJobTypes(): Promise<JobType[]> {
    return apiRequest<JobType[]>('/lookup/job-types');
  },

  // Get experience levels
  async getExperienceLevels(): Promise<ExperienceLevel[]> {
    return apiRequest<ExperienceLevel[]>('/lookup/experience-levels');
  },

  // Get companies
  async getCompanies(): Promise<Company[]> {
    return apiRequest<Company[]>('/lookup/companies');
  },

  // Get departments
  async getDepartments(): Promise<Department[]> {
    return apiRequest<Department[]>('/lookup/departments');
  },

  // Get application statuses
  async getApplicationStatuses(): Promise<ApplicationStatus[]> {
    return apiRequest<ApplicationStatus[]>('/lookup/application-statuses');
  },

  // Get skills
  async getSkills(
    search?: string,
    approvedOnly = true
  ): Promise<SkillsListResponse> {
    const params = new URLSearchParams({
      ...(search && { search }),
      ...(approvedOnly && { approved: 'true' }),
    });

    return apiRequest<SkillsListResponse>(`/lookup/skills?${params}`);
  },

  // Create new skill (pending approval)
  async createSkill(skillData: { name: string }): Promise<Skill> {
    return authenticatedRequest<Skill>('/lookup/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  },
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('auth_token');
  return !!token;
}

// Get current user from token
export function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

// Set authentication data
export function setAuthData(authResponse: AuthResponse): void {
  localStorage.setItem('auth_token', authResponse.token);
  localStorage.setItem('current_user', JSON.stringify(authResponse.user));
}

// Clear authentication data
export function clearAuthData(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
}

// Handle API errors globally
export function handleApiError(error: any): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export { ApiError };
