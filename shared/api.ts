//shared/api.ts
import { ReactNode } from 'react';

/**
 * Shared types between client and server
 * Used for type-safe API communication and data models
 */

// ==========================================
// 1. LOOKUP TYPES
// ==========================================

export interface Role {
  id: number;
  name: 'SuperAdmin' | 'HiringManager' | 'Candidate';
}

export interface JobStatus {
  id: number;
  name: string;
}

export interface JobType {
  id: number;
  name: string;
}

export interface ApplicationStatus {
  id: number;
  name: string;
}

export interface ReferralSource {
  id: number;
  name: string;
}

export interface AchievementType {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  name: string;
  website?: string;
  logo_url?: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface ExperienceLevel {
  id: number;
  name: string;
}

export interface InputType {
  id: number;
  name: string;
}

// ==========================================
// 2. LOCATION TYPES
// ==========================================

export interface Country {
  id: number;
  name: string;
}

export interface City {
  id: number;
  country_id: number;
  name: string;
}

export interface Area {
  id: number;
  city_id: number;
  name: string;
}

// ==========================================
// 3. CORE USER & PROFILE TYPES
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
  role?: Role;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface CandidateProfile {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  earliest_join_date?: string;
  country_id?: number;
  city_id?: number;
  area_id?: number;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  blog_url?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Joined relationships
  user?: User;
  country?: Country;
  city?: City;
  area?: Area;
  skills?: CandidateSkill[];
  education?: CandidateEducation[];
  achievements?: CandidateAchievement[];
  attachments?: CandidateAttachment[];
}

// ==========================================
// 4. JOBS & FORM BUILDER TYPES
// ==========================================

export interface Job {
  isActive: unknown;
  id: number;
  title: string;
  created_by_user_id: number;
  hiring_manager_id: number;
  company_id: number;
  department_id: number;
  experience_level_id: number;
  job_type_id: number;
  status_id: number;
  description: string;
  key_responsibilities?: string;
  requirements?: string;
  benefits?: string;
  salary_range?: string;
  location_text?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Joined relationships
  created_by?: User;
  hiring_manager?: User;
  company?: Company;
  department?: Department;
  experience_level?: ExperienceLevel;
  job_type?: JobType;
  status?: JobStatus;
  form_fields?: JobFormField[];
}

export interface JobFormField {
  order: any;
  type: string;
  placeholder: string;
  required: boolean;
  id: number;
  job_id: number;
  input_type_id: number;
  label: string;
  name: string;
  is_required: boolean;
  sort_order: number;
  
  // Joined relationships
  input_type?: InputType;
  options?: JobFormFieldOption[];
}

export interface JobFormFieldOption {
  id: number;
  job_form_field_id: number;
  option_label: string;
  option_value: string;
  sort_order: number;
}

// ==========================================
// 5. SKILLS, EDUCATION, FILES (Candidate Data)
// ==========================================

export interface Skill {
  id: number;
  name: string;
  is_approved: boolean;
}

export interface CandidateSkill {
  id: number;
  candidate_profile_id: number;
  skill_id: number;
  
  // Joined relationships
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
  achievement_type_id: number;
  title: string;
  description?: string;
  issue_date?: string;
  url?: string;
  
  // Joined relationships
  achievement_type?: AchievementType;
}

export interface CandidateAttachment {
  id: number;
  candidate_profile_id: number;
  file_type: string;
  file_url: string;
  file_size_kb: number;
  mime_type?: string;
  uploaded_at: string;
}

// ==========================================
// 6. APPLICATIONS & HISTORY TYPES
// ==========================================

export interface Application {
  jobId: number;
  candidateName: ReactNode;
  candidateEmail: ReactNode;
  id: number;
  job_id: number;
  candidate_user_id: number;
  status_id: number;
  referral_source_id?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Joined relationships
  job?: Job;
  candidate?: User;
  status?: ApplicationStatus;
  referral_source?: ReferralSource;
  answers?: ApplicationAnswer[];
  history?: ApplicationHistory[];
  feedback?: ApplicationUXFeedback;
}

export interface ApplicationAnswer {
  id: number;
  application_id: number;
  job_form_field_id: number;
  answer_text?: string;
  
  // Joined relationships
  job_form_field?: JobFormField;
}

export interface ApplicationHistory {
  id: number;
  application_id: number;
  previous_status_id?: number;
  new_status_id: number;
  changed_by_user_id: number;
  notes?: string;
  created_at: string;
  
  // Joined relationships
  application?: Application;
  previous_status?: ApplicationStatus;
  new_status?: ApplicationStatus;
  changed_by?: User;
}

export interface ApplicationUXFeedback {
  id: number;
  application_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

// ==========================================
// 7. REQUEST/RESPONSE TYPES
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
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  earliest_join_date?: string;
  country_id?: number;
  city_id?: number;
  area_id?: number;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  blog_url?: string;
}

export interface CandidateEducationRequest {
  institute_name: string;
  degree: string;
  major_subject: string;
  graduation_year?: number;
  result?: string;
}

export interface CandidateAchievementRequest {
  achievement_type_id: number;
  title: string;
  description?: string;
  issue_date?: string;
  url?: string;
}

export interface CandidateSkillRequest {
  skill_id: number;
  // For custom skills
  custom_skill_name?: string;
}

// Job Management
export type FormFieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'file';

export interface JobFormFieldRequest {
  input_type_id: number;
  label: string;
  name: string;
  is_required: boolean;
  sort_order: number;
  options?: Array<{
    option_label: string;
    option_value: string;
    sort_order: number;
  }>;
}

export interface CreateJobRequest {
  title: string;
  company_id: number;
  department_id: number;
  experience_level_id: number;
  job_type_id: number;
  description: string;
  key_responsibilities?: string;
  requirements?: string;
  benefits?: string;
  salary_range?: string;
  location_text?: string;
  hiring_manager_id?: number;
  form_fields?: JobFormFieldRequest[];
}

// Application
export interface SubmitApplicationRequest {
  job_id: number;
  referral_source_id?: number;
  answers: Array<{
    job_form_field_id: number;
    answer_text?: string;
  }>;
  candidate_profile?: CandidateProfileUpdateRequest;
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
  file_size_kb: number;
  mime_type: string;
}

// Filter and Search
export interface JobFilters {
  search?: string;
  job_type_id?: number;
  experience_level_id?: number;
  company_id?: number;
  department_id?: number;
  location?: string;
  salary_range?: string;
}

export interface CandidateFilters {
  search?: string;
  status_id?: number;
  job_id?: number;
  candidate_user_id?: number;
  skills?: number[];
  education_degree?: string;
  location?: {
    country_id?: number;
    city_id?: number;
    area_id?: number;
  };
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

export interface JobsListResponse {
  data: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApplicationsListResponse {
  data(data: any): unknown;
  applications: Application[];
  total: number;
}

export interface CandidatesListResponse {
  candidates: (Application & { 
    jobTitle: string;
    candidateProfile?: CandidateProfile;
  })[];
  total: number;
}

// Skills Management
export interface SkillCreateRequest {
  name: string;
}

export interface SkillsListResponse {
  skills: Skill[];
  total: number;
}

// Error Response
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}
