// shared/api.ts
/**
 * Shared types between client and server
 * Matches the ACTUAL database schema (lookup tables, not enums)
 */

// ==========================================
// 1. LOOKUP TABLE TYPES (with IDs)
// ==========================================

export interface Role {
  id: number;
  name: 'SuperAdmin' | 'HiringManager' | 'Candidate';
}

export interface JobStatus {
  id: number;
  name: string; // Draft, Published, Closed, Archived
}

export interface JobType {
  id: number;
  name: string; // Full-time, Part-time, Contract, Remote
}

export interface ApplicationStatus {
  id: number;
  name: string; // Applied, Screening, Interview, Offer, Rejected, Withdrawn
}

export interface ExperienceLevel {
  id: number;
  name: string; // Intern, Junior, Mid-Level, Senior, Lead/Architect
}

export interface Department {
  id: number;
  name: string;
}

export interface Area {
  id: number;
  name: string; // Banani, Gulshan 1, etc.
}

export interface Skill {
  id: number;
  name: string;
  is_approved: boolean;
}

// ==========================================
// 2. CORE USER & PROFILE TYPES
// ==========================================

export interface User {
  id: number;
  email: string;
  password_hash?: string;
  role_id: number;
  google_id?: string;
  linkedin_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  // Joined relationship
  role?: Role;
}

export interface CandidateProfile {
  id: number;
  user_id: number;
  full_name?: string;
  phone?: string;
  earliest_join_date?: string;
  area_id?: number;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  exp_salary_min?: string;
  exp_salary_max?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Joined relationships
  user?: User;
  area?: Area;
  skills?: CandidateSkill[];
  education?: CandidateEducation[];
  achievements?: CandidateAchievement[];
  attachments?: CandidateAttachment[];
}

// ==========================================
// 3. JOBS & FORM BUILDER TYPES
// ==========================================

// Global form field (from job_form_fields table)
export interface JobFormField {
  id: number;
  input_type: 'checkbox' | 'number' | 'text' | 'textarea';
  label: string;
}

// Job post with JSON field for form field IDs
export interface Job {
  id: number;
  title: string;
  department_id: number;
  experience_level_id: number;
  job_type_id: number;
  status_id: number;
  summary: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  salary_min?: string;
  salary_max?: string;
  deadline?: string;
  form_field_id?: number | number[] | null; // JSON field
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Joined relationships
  department?: Department;
  experience_level?: ExperienceLevel;
  job_type?: JobType;
  status?: JobStatus;
  form_fields?: JobFormField[]; // Populated from JSON IDs
}

// ==========================================
// 4. CANDIDATE DATA
// ==========================================

export interface CandidateSkill {
  candidate_profile_id: number;
  skill_id: number;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience?: number;
  // Joined relationship
  skill?: Skill;
}

export interface CandidateEducation {
  id: number;
  candidate_profile_id: number;
  institute_name: string;
  degree: string;
  major_subject: string;
  graduation_year?: number;
  result?: string;
}

export interface CandidateAchievement {
  id: number;
  candidate_profile_id: number;
  title: string;
  description?: string;
  url?: string;
  created_at: string;
}

export interface CandidateAttachment {
  id: number;
  candidate_profile_id: number;
  file_type: 'CV' | 'Portfolio' | 'Certificate' | 'Other';
  file_url: string;
  uploaded_at: string;
}

// ==========================================
// 5. APPLICATIONS & ANSWERS
// ==========================================

export interface Application {
  id: number;
  job_id: number;
  candidate_user_id: number;
  status_id: number;
  source: 'Direct' | 'LinkedIn' | 'Facebook' | 'Referral' | 'Indeed';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Computed properties for UI
  candidateName?: string;
  candidateEmail?: string;
  
  // Joined relationships
  job?: Job;
  candidate?: User;
  status?: ApplicationStatus;
  answers?: ApplicationAnswer[];
}

export interface ApplicationAnswer {
  id: number;
  application_id: number;
  job_form_field_id: number;
  answer_text?: string;
}

// ==========================================
// 6. REQUEST/RESPONSE TYPES
// ==========================================

// Authentication
export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  role: 'SuperAdmin' | 'HiringManager' | 'Candidate';
  firstName?: string;
  lastName?: string;
}

// Profile Management
export interface CandidateProfileUpdateRequest {
  full_name?: string;
  phone?: string;
  earliest_join_date?: string;
  area_id?: number;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  exp_salary_min?: string;
  exp_salary_max?: string;
}

export interface CandidateEducationRequest {
  institute_name: string;
  degree: string;
  major_subject: string;
  graduation_year?: number;
  result?: string;
}

export interface CandidateAchievementRequest {
  title: string;
  description?: string;
  url?: string;
}

export interface CandidateSkillRequest {
  skill_id?: number;
  custom_skill_name?: string;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

// Job Management
export interface CreateJobRequest {
  title: string;
  department_id: number;
  experience_level_id: number;
  job_type_id: number;
  summary: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  salary_min?: string;
  salary_max?: string;
  deadline?: string;
  form_field_ids?: number[]; // Array of form field IDs
}

export interface UpdateJobRequest {
  title?: string;
  department_id?: number;
  experience_level_id?: number;
  job_type_id?: number;
  status_id?: number;
  summary?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  salary_min?: string;
  salary_max?: string;
  deadline?: string;
  form_field_ids?: number[];
}

// Application Submission
export interface SubmitApplicationRequest {
  job_id: number;
  source: 'Direct' | 'LinkedIn' | 'Facebook' | 'Referral' | 'Indeed';
  answers: Array<{
    job_form_field_id: number;
    answer_text?: string;
  }>;
}

export interface UpdateApplicationStatusRequest {
  status_id: number;
  notes?: string;
}

export interface ApplicationFeedbackRequest {
  rating: number;
  comment?: string;
}

// File Upload
export interface FileUploadResponse {
  file_url: string;
  file_size_kb?: number;
  mime_type?: string;
}

// Filter and Search
export interface JobFilters {
  search?: string;
  department_id?: number;
  experience_level_id?: number;
  job_type_id?: number;
  status_id?: number;
}

export interface ApplicationFilters {
  search?: string;
  status_id?: number;
  job_id?: number;
  candidate_user_id?: number;
  created_after?: string;
  created_before?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response Types
export interface DemoResponse {
  message: string;
}

// Error Response
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

// Form Builder Types
export interface FormFieldOption {
  option_label: string;
  option_value: string;
  sort_order: number;
}

// For creating new form fields
export interface CreateJobFormFieldRequest {
  input_type: 'checkbox' | 'number' | 'text' | 'textarea';
  label: string;
  options?: FormFieldOption[];
}