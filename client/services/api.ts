// client/services/api.ts
import type { 
  Department, 
  ExperienceLevel, 
  JobType, 
  JobStatus, 
  ApplicationStatus,
  Area,
  User,
  CandidateProfile,
  Job,
  JobFormField,
  Application,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  CandidateProfileUpdateRequest,
  CandidateEducationRequest,
  CandidateAchievementRequest,
  CandidateSkillRequest,
  CreateJobRequest,
  SubmitApplicationRequest,
  UpdateApplicationStatusRequest,
  FileUploadResponse,
  JobFilters,
  ApplicationFilters,
  PaginatedResponse,
  DemoResponse,
  JobsListResponse,
  ApplicationsListResponse,
  ApiError,
  Skill
} from '@shared/api';

const API_BASE_URL = '/api';

// Generic fetch wrapper with error handling
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    
    // Handle non-JSON responses (like HTML error pages)
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // Check if response is JSON
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      // Handle non-JSON responses
      throw new Error(`Server returned non-JSON response: ${response.status}`);
    }
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// Applications API
export const applicationsApi = {
  submitApplication: async (applicationData: SubmitApplicationRequest) => {
    return apiFetch<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },
  
  getApplications: async (filters?: ApplicationFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status_id) params.append('status_id', filters.status_id.toString());
    if (filters?.job_id) params.append('job_id', filters.job_id.toString());
    if (filters?.candidate_user_id) params.append('candidate_user_id', filters.candidate_user_id.toString());
    if (filters?.created_after) params.append('created_after', filters.created_after);
    if (filters?.created_before) params.append('created_before', filters.created_before);
    
    const queryString = params.toString();
    return apiFetch<ApplicationsListResponse>(`/applications${queryString ? `?${queryString}` : ''}`);
  },
  
  getApplicationById: async (id: number): Promise<Application> => {
    return apiFetch<Application>(`/applications/${id}`);
  },
  
  updateApplicationStatus: async (id: number, statusData: UpdateApplicationStatusRequest) => {
    return apiFetch(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  },
  
  withdrawApplication: async (applicationId: number) => {
    return apiFetch(`/applications/${applicationId}/withdraw`, {
      method: 'DELETE',
    });
  },
};

// Candidate Profile API
export const candidateApi = {
  getMyProfile: async (): Promise<CandidateProfile> => {
    return apiFetch('/candidate/profile');
  },
  
  updateProfile: async (profileData: CandidateProfileUpdateRequest) => {
    return apiFetch<CandidateProfile>('/candidate/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
  
  addEducation: async (educationData: CandidateEducationRequest) => {
    return apiFetch('/candidate/education', {
      method: 'POST',
      body: JSON.stringify(educationData),
    });
  },
  
  updateEducation: async (id: number, educationData: CandidateEducationRequest) => {
    return apiFetch(`/candidate/education/${id}`, {
      method: 'PUT',
      body: JSON.stringify(educationData),
    });
  },
  
  deleteEducation: async (id: number) => {
    return apiFetch(`/candidate/education/${id}`, {
      method: 'DELETE',
    });
  },
  
  addAchievement: async (achievementData: CandidateAchievementRequest) => {
    return apiFetch('/candidate/achievements', {
      method: 'POST',
      body: JSON.stringify(achievementData),
    });
  },
  
  updateAchievement: async (id: number, achievementData: CandidateAchievementRequest) => {
    return apiFetch(`/candidate/achievements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(achievementData),
    });
  },
  
  deleteAchievement: async (id: number) => {
    return apiFetch(`/candidate/achievements/${id}`, {
      method: 'DELETE',
    });
  },
  
  addSkill: async (skillData: CandidateSkillRequest) => {
    return apiFetch('/candidate/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  },
  
  removeSkill: async (skillId: number) => {
    return apiFetch(`/candidate/skills/${skillId}`, {
      method: 'DELETE',
    });
  },
  
  uploadFile: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiFetch('/candidate/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  },
};

// Auth API
export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  signup: async (userData: SignupRequest): Promise<AuthResponse> => {
    return apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  logout: async () => {
    return apiFetch('/auth/logout', {
      method: 'POST',
    });
  },
  
  refreshToken: async (): Promise<AuthResponse> => {
    return apiFetch('/auth/refresh', {
      method: 'POST',
    });
  },
  
  validateToken: async (): Promise<{ valid: boolean }> => {
    return apiFetch('/auth/validate');
  },

  sendOTP: async (email: string): Promise<{ message: string }> => {
    return apiFetch('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyOTP: async (email: string, otp: string): Promise<{ valid: boolean }> => {
    return apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  signupWithOTP: async (userData: { email: string; password: string; firstName?: string; lastName?: string; otp: string }): Promise<AuthResponse> => {
    return apiFetch('/auth/signup-with-otp', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

// Jobs API
export const jobsApi = {
  createJob: async (jobData: CreateJobRequest) => {
    return apiFetch<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },
  
  getJobs: async (page?: number, limit?: number, filters?: JobFilters) => {
    const params = new URLSearchParams({
      ...(page && { page: page.toString() }),
      ...(limit && { limit: limit.toString() }),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.department_id && { department_id: filters.department_id.toString() }),
      ...(filters?.experience_level_id && { experience_level_id: filters.experience_level_id.toString() }),
      ...(filters?.job_type_id && { job_type_id: filters.job_type_id.toString() }),
      ...(filters?.status_id && { status_id: filters.status_id.toString() }),
    }).toString();
    
    return apiFetch<JobsListResponse>(`/jobs${params ? `?${params}` : ''}`);
  },
  
  getJob: async (id: number) => {
    return apiFetch<Job>(`/jobs/${id}`);
  },
  
  updateJob: async (id: number, jobData: Partial<CreateJobRequest>) => {
    return apiFetch<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },
  
  deleteJob: async (id: number) => {
    return apiFetch(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },
  
  getJobStats: async () => {
    return apiFetch('/jobs/stats');
  },
};

// Lookup API
export const lookupApi = {
  getDepartments: async (): Promise<Department[]> => {
    return apiFetch('/lookup/departments');
  },
  
  getExperienceLevels: async (): Promise<ExperienceLevel[]> => {
    return apiFetch('/lookup/experience-levels');
  },
  
  getJobTypes: async (): Promise<JobType[]> => {
    return apiFetch('/lookup/job-types');
  },
  
  getJobStatuses: async (): Promise<JobStatus[]> => {
    return apiFetch('/lookup/job-statuses');
  },
  
  getApplicationStatuses: async (): Promise<ApplicationStatus[]> => {
    return apiFetch('/lookup/application-statuses');
  },
  
  getAreas: async (): Promise<Area[]> => {
    return apiFetch('/lookup/areas');
  },
  
  getSkills: async (search?: string, approved?: boolean): Promise<Skill[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (approved !== undefined) params.append('approved', approved.toString());
    
    const queryString = params.toString();
    return apiFetch(`/lookup/skills${queryString ? `?${queryString}` : ''}`);
  },
  
  createSkill: async (name: string): Promise<Skill> => {
    return apiFetch('/lookup/skills', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
  
  getJobFormFields: async (): Promise<JobFormField[]> => {
    return apiFetch('/lookup/job-form-fields');
  },
  
  // DEPRECATED: Remove non-existent endpoints
  getCompanies: async (): Promise<any[]> => {
    console.warn('getCompanies is deprecated - companies table removed');
    return []; // Return empty array instead of calling removed endpoint
  },
  
  getCountries: async (): Promise<any[]> => {
    console.warn('getCountries is deprecated - countries table removed');
    return []; // Return empty array instead of calling removed endpoint
  },
  
  getCities: async (countryId?: number): Promise<any[]> => {
    console.warn('getCities is deprecated - cities table removed');
    return []; // Return empty array instead of calling removed endpoint
  },
};

// Admin API
export const adminApi = {
  getUsers: async (filters?: { page?: number; limit?: number; search?: string }) => {
    const params = new URLSearchParams({
      ...(filters?.page && { page: filters.page.toString() }),
      ...(filters?.limit && { limit: filters.limit.toString() }),
      ...(filters?.search && { search: filters.search }),
    }).toString();
    
    return apiFetch(`/admin/users${params ? `?${params}` : ''}`);
  },
  
  createUser: async (userData: { email: string; role_name: 'SuperAdmin' | 'HiringManager' | 'Candidate' }) => {
    return apiFetch('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  updateUserStatus: async (id: number, is_active: boolean) => {
    return apiFetch(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active }),
    });
  },
  
  updateUserRole: async (id: number, role_name: string) => {
    return apiFetch(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role_name }),
    });
  },
  
  deleteUser: async (id: number) => {
    return apiFetch(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },
  
  getSystemStats: async () => {
    return apiFetch('/admin/stats');
  },
  
  getAuditLog: async (filters?: { page?: number; limit?: number; start_date?: string; end_date?: string }) => {
    const params = new URLSearchParams(filters as any).toString();
    return apiFetch(`/admin/audit-log${params ? `?${params}` : ''}`);
  },
  
  exportData: async (type: string, filters?: any) => {
    const params = new URLSearchParams({ type, ...filters }).toString();
    return apiFetch(`/admin/export${params ? `?${params}` : ''}`);
  },
};