// API service functions for the career portal

// Import types from shared API
import type { 
  Company, 
  Department, 
  ExperienceLevel, 
  JobType, 
  JobStatus, 
  ApplicationStatus,
  ReferralSource,
  InputType,
  Country,
  City,
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
  ApplicationFeedbackRequest,
  FileUploadResponse,
  JobFilters,
  CandidateFilters,
  PaginatedResponse,
  DemoResponse,
  JobsListResponse,
  ApplicationsListResponse,
  CandidatesListResponse,
  SkillCreateRequest,
  SkillsListResponse,
  ApiError
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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

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
      ...(filters?.job_type_id && { job_type_id: filters.job_type_id.toString() }),
      ...(filters?.experience_level_id && { experience_level_id: filters.experience_level_id.toString() }),
      ...(filters?.company_id && { company_id: filters.company_id.toString() }),
      ...(filters?.department_id && { department_id: filters.department_id.toString() }),
      ...(filters?.location && { location: filters.location }),
      ...(filters?.salary_range && { salary_range: filters.salary_range }),
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
};

// Lookup API
export const lookupApi = {
  getCompanies: async (): Promise<Company[]> => {
    return apiFetch('/lookup/companies');
  },
  
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
  
  getApplicationStatuses: async () => {
    return apiFetch('/lookup/application-statuses');
  },
  
  getReferralSources: async () => {
    return apiFetch('/lookup/referral-sources');
  },
  
  getInputTypes: async () => {
    return apiFetch('/lookup/input-types');
  },
  
  getCountries: async () => {
    return apiFetch('/lookup/countries');
  },
  
  getCities: async (countryId?: number) => {
    const params = countryId ? `?country_id=${countryId}` : '';
    return apiFetch(`/lookup/cities${params}`);
  },
  
  getAreas: async (cityId?: number) => {
    const params = cityId ? `?city_id=${cityId}` : '';
    return apiFetch(`/lookup/areas${params}`);
  },

  getSkills: async (search?: string, approved?: boolean): Promise<any[]> => {
    const params = new URLSearchParams({
      ...(search && { search }),
      ...(approved !== undefined && { approved: approved.toString() }),
    }).toString();
    return apiFetch(`/lookup/skills${params ? `?${params}` : ''}`);
  },

  createSkill: async (skillData: SkillCreateRequest): Promise<any> => {
    return apiFetch('/lookup/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  },
};

// Applications API
export const applicationsApi = {
  submitApplication: async (applicationData: SubmitApplicationRequest) => {
    return apiFetch<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },
  
  getApplications: async (filters?: CandidateFilters) => {
    if (filters) {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status_id) params.append('status_id', filters.status_id.toString());
      if (filters.job_id) params.append('job_id', filters.job_id.toString());
      if (filters.skills) params.append('skills', filters.skills.join(','));
      if (filters.location?.country_id) params.append('country_id', filters.location.country_id.toString());
      if (filters.location?.city_id) params.append('city_id', filters.location.city_id.toString());
      if (filters.location?.area_id) params.append('area_id', filters.location.area_id.toString());
      if (filters.created_after) params.append('created_after', filters.created_after);
      if (filters.created_before) params.append('created_before', filters.created_before);
      
      return apiFetch<ApplicationsListResponse>(`/applications?${params.toString()}`);
    }
    return apiFetch<ApplicationsListResponse>('/applications');
  },
  
  getApplicationById: async (id: number): Promise<Application> => {
    return apiFetch(`/applications/${id}`);
  },
  
  updateApplicationStatus: async (id: number, statusData: UpdateApplicationStatusRequest) => {
    return apiFetch(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  },
  
  submitApplicationFeedback: async (id: number, feedbackData: ApplicationFeedbackRequest) => {
    return apiFetch(`/applications/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData),
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
  
  getCurrentUser: async (): Promise<User> => {
    return apiFetch('/auth/me');
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

// Candidate Profile API
export const candidateApi = {
  getProfile: async () => {
    return apiFetch('/candidate/profile');
  },

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

  withdrawApplication: async (applicationId: number) => {
    return apiFetch(`/applications/${applicationId}/withdraw`, {
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

// Admin API
export const adminApi = {
  getUsers: async (filters?: any) => {
    const params = new URLSearchParams(filters).toString();
    return apiFetch(`/admin/users${params ? `?${params}` : ''}`);
  },
  
  createUser: async (userData: any) => {
    return apiFetch('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  updateUser: async (id: number, userData: any) => {
    return apiFetch(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
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
  
  getAuditLog: async (filters?: any) => {
    const params = new URLSearchParams(filters).toString();
    return apiFetch(`/admin/audit-log${params ? `?${params}` : ''}`);
  },
  
  exportData: async (type: string, filters?: any) => {
    const params = new URLSearchParams({ type, ...filters }).toString();
    return apiFetch(`/admin/export${params ? `?${params}` : ''}`);
  },
};
