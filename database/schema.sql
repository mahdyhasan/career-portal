-- Updated Career Portal Database Schema
-- MySQL 8.0+ compatible with enhancements

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS augmex_career CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE augmex_career;

-- ==========================================
-- 1. LOOKUP TABLES
-- ==========================================

-- Roles table
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name ENUM('SuperAdmin', 'HiringManager', 'Candidate') NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Job Statuses
CREATE TABLE job_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Job Types
CREATE TABLE job_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Application Statuses
CREATE TABLE application_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Referral Sources
CREATE TABLE referral_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Achievement Types
CREATE TABLE achievement_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Input Types (for dynamic form fields)
CREATE TABLE input_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name ENUM('text', 'textarea', 'number', 'select', 'checkbox', 'file') NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Companies
CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(500),
  logo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Departments
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Experience Levels
CREATE TABLE experience_levels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. LOCATION TABLES
-- ==========================================

-- Countries
CREATE TABLE countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cities
CREATE TABLE cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Areas
CREATE TABLE areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 2.5. OTP VERIFICATION TABLE
-- ==========================================

-- OTP Codes for email verification
CREATE TABLE otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email_otp (email, otp)
);

-- ==========================================
-- 3. CORE USER & PROFILE TABLES
-- ==========================================

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  role_id INT NOT NULL,
  google_id VARCHAR(255),
  linkedin_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Candidate Profiles
CREATE TABLE candidate_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  headline VARCHAR(255) COMMENT 'Professional headline for search',
  bio TEXT,
  earliest_join_date DATE,
  country_id INT,
  city_id INT,
  area_id INT,
  linkedin_url VARCHAR(500),
  github_url VARCHAR(500),
  portfolio_url VARCHAR(500),
  blog_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (country_id) REFERENCES countries(id),
  FOREIGN KEY (city_id) REFERENCES cities(id),
  FOREIGN KEY (area_id) REFERENCES areas(id)
);

-- ==========================================
-- 4. SKILLS, EDUCATION, FILES (Candidate Data)
-- ==========================================

-- Skills
CREATE TABLE skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Candidate Skills (junction table)
CREATE TABLE candidate_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_profile_id INT NOT NULL,
  skill_id INT NOT NULL,
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE KEY unique_candidate_skill (candidate_profile_id, skill_id)
);

-- Candidate Education
CREATE TABLE candidate_education (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_profile_id INT NOT NULL,
  institute_name VARCHAR(255) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  major_subject VARCHAR(255),
  graduation_year INT,
  result VARCHAR(100),
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

-- Candidate Achievements
CREATE TABLE candidate_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_profile_id INT NOT NULL,
  achievement_type_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  issue_date DATE,
  url VARCHAR(500),
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_type_id) REFERENCES achievement_types(id)
);

-- Candidate Attachments (CV, Portfolio, etc.)
CREATE TABLE candidate_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_profile_id INT NOT NULL,
  file_type ENUM('resume', 'cover_letter', 'portfolio', 'photo', 'other') NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size_kb INT NOT NULL,
  mime_type VARCHAR(100),
  parsed_text TEXT COMMENT 'Extracted text for full-text search',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. JOBS & FORM BUILDER TABLES
-- ==========================================

-- Jobs
CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  created_by_user_id INT NOT NULL,
  hiring_manager_id INT NOT NULL,
  company_id INT NOT NULL,
  department_id INT NOT NULL,
  experience_level_id INT NOT NULL,
  job_type_id INT NOT NULL,
  status_id INT NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  key_responsibilities TEXT,
  requirements TEXT,
  benefits TEXT,
  salary_range VARCHAR(255),
  location_text VARCHAR(255),
  auto_reject_days INT NULL COMMENT 'If applied > X days ago and still in Screen, auto reject',
  auto_remind_hours INT NULL COMMENT 'Remind interviewer X hours before interview',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  FOREIGN KEY (hiring_manager_id) REFERENCES users(id),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (experience_level_id) REFERENCES experience_levels(id),
  FOREIGN KEY (job_type_id) REFERENCES job_types(id),
  FOREIGN KEY (status_id) REFERENCES job_statuses(id)
);

-- Job Form Fields (dynamic form builder)
CREATE TABLE job_form_fields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  input_type_id INT NOT NULL,
  label VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (input_type_id) REFERENCES input_types(id)
);

-- Job Form Field Options (for select/checkbox fields)
CREATE TABLE job_form_field_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_form_field_id INT NOT NULL,
  option_label VARCHAR(255) NOT NULL,
  option_value VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (job_form_field_id) REFERENCES job_form_fields(id) ON DELETE CASCADE
);

-- ==========================================
-- 6. APPLICATIONS & HISTORY TABLES
-- ==========================================

-- Applications
CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  candidate_user_id INT NOT NULL,
  status_id INT NOT NULL,
  referral_source_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (candidate_user_id) REFERENCES users(id),
  FOREIGN KEY (status_id) REFERENCES application_statuses(id),
  FOREIGN KEY (referral_source_id) REFERENCES referral_sources(id),
  UNIQUE KEY unique_job_candidate (job_id, candidate_user_id)
);

-- Application Answers (form field responses)
CREATE TABLE application_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  job_form_field_id INT NOT NULL,
  answer_text TEXT,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (job_form_field_id) REFERENCES job_form_fields(id)
);

-- Application Activities (renamed from application_history for clarity)
CREATE TABLE application_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  activity_type ENUM('status_change', 'comment', 'note', 'email_sent', 'interview_log', 'system_event') NOT NULL DEFAULT 'status_change',
  previous_status_id INT,
  new_status_id INT COMMENT 'Nullable because a comment doesnt change status',
  changed_by_user_id INT NOT NULL,
  notes TEXT,
  is_internal BOOLEAN DEFAULT TRUE COMMENT '0 = Visible to candidate, 1 = Team only',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (previous_status_id) REFERENCES application_statuses(id),
  FOREIGN KEY (new_status_id) REFERENCES application_statuses(id),
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);

-- Application UX Feedback (1-5 rating + comment)
CREATE TABLE application_ux_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL UNIQUE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

-- ==========================================
-- 7. NEW ENHANCED FEATURES TABLES
-- ==========================================

-- Tags (for polymorphic tagging system)
CREATE TABLE tags (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color_hex VARCHAR(7) DEFAULT '#6B7280',
  type ENUM('job', 'candidate', 'general') DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Taggables (polymorphic relationship for tags)
CREATE TABLE taggables (
  tag_id BIGINT UNSIGNED NOT NULL,
  taggable_id BIGINT UNSIGNED NOT NULL,
  taggable_type VARCHAR(255) NOT NULL COMMENT 'App\\Models\\Job or App\\Models\\CandidateProfile',
  PRIMARY KEY (tag_id, taggable_id, taggable_type),
  KEY taggables_index (taggable_type, taggable_id),
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Offer Templates (for standardized offer communications)
CREATE TABLE offer_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT 'e.g. Standard Engineering Offer',
  subject VARCHAR(255) NOT NULL,
  body LONGTEXT NOT NULL COMMENT 'HTML content with placeholders like {{candidate_name}}, {{salary}}',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Audit Logs (for security and compliance)
CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL COMMENT 'Null if system action',
  event VARCHAR(255) NOT NULL COMMENT 'created, updated, deleted',
  auditable_type VARCHAR(255) NOT NULL,
  auditable_id BIGINT UNSIGNED NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications (for system-wide notifications)
CREATE TABLE notifications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  type VARCHAR(255) NOT NULL,
  notifiable_type VARCHAR(255) NOT NULL,
  notifiable_id BIGINT UNSIGNED NOT NULL,
  data TEXT NOT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);

-- ==========================================
-- 8. INDEXES FOR PERFORMANCE
-- ==========================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_active ON users(is_active, deleted_at);

-- Jobs indexes
CREATE INDEX idx_jobs_status ON jobs(status_id, deleted_at);
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_type ON jobs(job_type_id);
CREATE INDEX idx_jobs_experience ON jobs(experience_level_id);
CREATE INDEX idx_jobs_created ON jobs(created_at);

-- Applications indexes
CREATE INDEX idx_applications_job ON applications(job_id, status_id);
CREATE INDEX idx_applications_candidate ON applications(candidate_user_id);
CREATE INDEX idx_applications_created ON applications(created_at);

-- Candidate profiles indexes
CREATE INDEX idx_candidate_profile_user ON candidate_profiles(user_id);
CREATE INDEX idx_candidate_profile_location ON candidate_profiles(country_id, city_id, area_id);

-- Full-text search indexes for MySQL 8
CREATE FULLTEXT INDEX idx_jobs_search ON jobs(title, description);
CREATE FULLTEXT INDEX idx_profiles_search ON candidate_profiles(headline, bio);
CREATE FULLTEXT INDEX idx_resume_search ON candidate_attachments(parsed_text);

-- ==========================================
-- 9. INSERT DEFAULT DATA
-- ==========================================

-- Insert default roles
INSERT INTO roles (name) VALUES 
('SuperAdmin'),
('HiringManager'),
('Candidate');

-- Insert default job statuses
INSERT INTO job_statuses (name) VALUES 
('Draft'),
('Published'),
('Closed'),
('Paused');

-- Insert default job types
INSERT INTO job_types (name) VALUES 
('Full-time'),
('Part-time'),
('Contract'),
('Internship'),
('Remote');

-- Insert default application statuses
INSERT INTO application_statuses (name) VALUES 
('Applied'),
('Under Review'),
('Screening'),
('Interview'),
('Technical Assessment'),
('Offer'),
('Rejected'),
('Withdrawn');

-- Insert default referral sources
INSERT INTO referral_sources (name) VALUES 
('LinkedIn'),
('Indeed'),
('Company Website'),
('Referral'),
('Social Media'),
('Job Board'),
('Other');

-- Insert default achievement types
INSERT INTO achievement_types (name) VALUES 
('Certification'),
('Award'),
('Publication'),
('Patent'),
('Conference'),
('Workshop'),
('Other');

-- Insert default input types
INSERT INTO input_types (name) VALUES 
('text'),
('textarea'),
('number'),
('select'),
('checkbox'),
('file');

-- Insert default companies
INSERT INTO companies (name, website) VALUES 
('Augmex', 'https://augmex.com'),
('Tech Corp', 'https://techcorp.com'),
('StartupXYZ', 'https://startupxyz.com');

-- Insert default departments
INSERT INTO departments (name) VALUES 
('Engineering'),
('Marketing'),
('Sales'),
('HR'),
('Finance'),
('Operations');

-- Insert default experience levels
INSERT INTO experience_levels (name) VALUES 
('Entry Level'),
('Mid Level'),
('Senior Level'),
('Lead/Manager'),
('Director/VP');

-- Insert default countries
INSERT INTO countries (name) VALUES 
('United States'),
('United Kingdom'),
('Canada'),
('Australia'),
('Germany'),
('Bangladesh'),
('India');

-- Insert default cities (example)
INSERT INTO cities (country_id, name) VALUES 
(1, 'New York'),
(1, 'San Francisco'),
(1, 'Austin'),
(7, 'Dhaka'),
(7, 'Chittagong'),
(8, 'Bangalore'),
(8, 'Mumbai');

-- Insert default skills
INSERT INTO skills (name, is_approved) VALUES 
('JavaScript', TRUE),
('React', TRUE),
('Node.js', TRUE),
('Python', TRUE),
('Java', TRUE),
('SQL', TRUE),
('AWS', TRUE),
('Docker', TRUE),
('Git', TRUE),
('Agile', TRUE),
('Communication', TRUE),
('Leadership', TRUE);

-- Insert default tags
INSERT INTO tags (name, color_hex, type) VALUES 
('Urgent', '#FF0000', 'job'),
('Remote-Friendly', '#00FF00', 'job'),
('Senior-Level', '#0000FF', 'job'),
('Top Candidate', '#FF00FF', 'candidate'),
('Technical Expert', '#00FFFF', 'candidate'),
('Leadership Potential', '#FFFF00', 'candidate');