-- Career Portal - Database Schema Fix
-- This script fixes all the missing tables and column mismatches
-- between the server code and the database schema

-- ============================================
-- MISSING TABLES THAT SERVER CODE EXPECTS
-- ============================================

-- Candidate Profiles Table (main candidate profile table)
CREATE TABLE IF NOT EXISTS candidate_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    earliest_join_date DATE,
    area_id INT,
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    exp_salary_min DECIMAL(10, 2),
    exp_salary_max DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id),
    INDEX idx_user_id (user_id),
    INDEX idx_deleted_at (deleted_at)
);

-- Candidate Education (plural table name as expected by code)
CREATE TABLE IF NOT EXISTS candidate_educations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_profile_id INT NOT NULL,
    institute_name VARCHAR(255) NOT NULL,
    degree VARCHAR(100) NOT NULL,
    major_subject VARCHAR(100),
    graduation_year INT,
    result VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    INDEX idx_candidate_profile_id (candidate_profile_id)
);

-- Candidate Achievements (plural table name as expected by code)
CREATE TABLE IF NOT EXISTS candidate_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_profile_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    INDEX idx_candidate_profile_id (candidate_profile_id)
);

-- Candidate Attachments (as expected by fileUpload.ts)
CREATE TABLE IF NOT EXISTS candidate_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_profile_id INT NOT NULL,
    file_type ENUM('resume', 'coverLetter', 'portfolio', 'CV', 'Certificate', 'Other') NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size_kb INT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    INDEX idx_candidate_profile_id (candidate_profile_id),
    INDEX idx_file_type (file_type)
);

-- Candidate Skills (junction table)
CREATE TABLE IF NOT EXISTS candidate_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_profile_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
    years_experience DECIMAL(3, 1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_candidate_skill (candidate_profile_id, skill_id),
    INDEX idx_candidate_profile_id (candidate_profile_id),
    INDEX idx_skill_id (skill_id)
);

-- System Skills (as expected by code)
CREATE TABLE IF NOT EXISTS system_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    is_approved BOOLEAN DEFAULT TRUE,
    category VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_is_approved (is_approved)
);

-- System Areas (as expected by code)
CREATE TABLE IF NOT EXISTS system_areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    city_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id),
    INDEX idx_name (name)
);

-- System Departments (as expected by code)
CREATE TABLE IF NOT EXISTS system_departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    manager_id INT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id),
    INDEX idx_name (name)
);

-- Job Posts (as expected by code)
CREATE TABLE IF NOT EXISTS job_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    experience_level_id INT,
    job_type_id INT,
    status_id INT,
    summary TEXT NOT NULL,
    responsibilities TEXT,
    requirements TEXT,
    benefits TEXT,
    salary_min DECIMAL(10, 2),
    salary_max DECIMAL(10, 2),
    deadline DATE,
    form_field_id JSON,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (department_id) REFERENCES system_departments(id),
    FOREIGN KEY (experience_level_id) REFERENCES experience_levels(id),
    FOREIGN KEY (job_type_id) REFERENCES job_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_department_id (department_id),
    INDEX idx_status_id (status_id),
    INDEX idx_created_by (created_by),
    INDEX idx_deleted_at (deleted_at)
);

-- Application Statuses (as expected by code)
CREATE TABLE IF NOT EXISTS application_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Job Experience Levels (as expected by code)
CREATE TABLE IF NOT EXISTS job_experience_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    min_years INT,
    max_years INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Job Statuses (as expected by code)
CREATE TABLE IF NOT EXISTS job_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Application Answers (for dynamic forms)
CREATE TABLE IF NOT EXISTS application_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    job_form_field_id INT NOT NULL,
    answer_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (job_form_field_id) REFERENCES job_form_fields(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id),
    INDEX idx_job_form_field_id (job_form_field_id)
);

-- Job Form Fields (for dynamic application forms)
CREATE TABLE IF NOT EXISTS job_form_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    input_type ENUM('text', 'textarea', 'select', 'checkbox', 'radio', 'email', 'number', 'date', 'file') NOT NULL,
    label VARCHAR(255) NOT NULL,
    options JSON,
    is_required BOOLEAN DEFAULT FALSE,
    validation_rules JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_input_type (input_type),
    INDEX idx_label (label)
);

-- Roles Table (as expected by auth code)
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- OTP Codes Table (for authentication)
CREATE TABLE IF NOT EXISTS otp_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_expires_at (expires_at)
);

-- ============================================
-- FIXES TO EXISTING TABLES
-- ============================================

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_id INT NULL AFTER role,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE AFTER role_id,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL AFTER is_active,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER password;

-- Add foreign key for role_id if not exists
ALTER TABLE users 
ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Add missing columns to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS candidate_user_id INT NULL AFTER user_id,
ADD COLUMN IF NOT EXISTS status_id INT NULL AFTER candidate_user_id,
ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'Direct' AFTER status_id,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL AFTER source;

-- Update applications table to use proper foreign keys and remove old columns
-- Note: This will need manual migration of existing data

-- Add indexes to applications table
ALTER TABLE applications 
ADD INDEX IF NOT EXISTS idx_candidate_user_id (candidate_user_id),
ADD INDEX IF NOT EXISTS idx_status_id (status_id),
ADD INDEX IF NOT EXISTS idx_deleted_at (deleted_at);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('SuperAdmin', 'Super administrator with full system access'),
('HiringManager', 'Manager who can create jobs and review applications'),
('Candidate', 'Job seeker who can apply for jobs')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert default application statuses
INSERT INTO application_statuses (name, description) VALUES
('Applied', 'Application has been submitted'),
('Under Review', 'Application is being reviewed'),
('Interview Scheduled', 'Interview has been scheduled'),
('Interview Completed', 'Interview has been completed'),
('Offer Made', 'Job offer has been made'),
('Offer Accepted', 'Job offer has been accepted'),
('Offer Rejected', 'Job offer has been rejected'),
('Hired', 'Candidate has been hired'),
('Rejected', 'Application has been rejected'),
('Withdrawn', 'Application has been withdrawn by candidate')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert job statuses
INSERT INTO job_statuses (name, description) VALUES
('Draft', 'Job is in draft mode'),
('Published', 'Job is published and accepting applications'),
('Closed', 'Job is closed to new applications'),
('Archived', 'Job is archived')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Map existing roles to new role_id system
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = role) WHERE role IS NOT NULL;

-- Migrate application statuses to new system
-- This is a basic mapping - you may need to adjust based on your actual status values
UPDATE applications SET status_id = (
    SELECT id FROM application_statuses WHERE 
    CASE 
        WHEN status = 'pending' THEN 'Applied'
        WHEN status = 'reviewing' THEN 'Under Review'
        WHEN status = 'interview_scheduled' THEN 'Interview Scheduled'
        WHEN status = 'interview_completed' THEN 'Interview Completed'
        WHEN status = 'offer_made' THEN 'Offer Made'
        WHEN status = 'offer_accepted' THEN 'Offer Accepted'
        WHEN status = 'offer_rejected' THEN 'Offer Rejected'
        WHEN status = 'hired' THEN 'Hired'
        WHEN status = 'rejected' THEN 'Rejected'
        WHEN status = 'withdrawn' THEN 'Withdrawn'
        ELSE 'Applied'
    END = application_statuses.name
    LIMIT 1
) WHERE status IS NOT NULL;

-- Migrate user_id to candidate_user_id in applications
UPDATE applications SET candidate_user_id = user_id WHERE user_id IS NOT NULL;

-- ============================================
-- UPDATE VIEWS AND INDEXES
-- ============================================

-- Create view for active candidate profiles
CREATE OR REPLACE VIEW active_candidate_profiles AS
SELECT 
    cp.*,
    u.email,
    u.role,
    a.name as area_name,
    u.first_name,
    u.last_name
FROM candidate_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN system_areas a ON cp.area_id = a.id
WHERE cp.deleted_at IS NULL AND u.deleted_at IS NULL;

-- Create view for active job posts
CREATE OR REPLACE VIEW active_job_posts AS
SELECT 
    jp.*,
    sd.name as department_name,
    jel.name as experience_level_name,
    jt.name as job_type_name,
    js.name as status_name,
    u.first_name as created_by_first_name,
    u.last_name as created_by_last_name
FROM job_posts jp
LEFT JOIN system_departments sd ON jp.department_id = sd.id
LEFT JOIN job_experience_levels jel ON jp.experience_level_id = jel.id
LEFT JOIN job_types jt ON jp.job_type_id = jt.id
LEFT JOIN job_statuses js ON jp.status_id = js.id
LEFT JOIN users u ON jp.created_by = u.id
WHERE jp.deleted_at IS NULL;

-- ============================================
-- CLEANUP AND FINALIZATIONS
-- ============================================

-- Update any existing users to ensure they have proper role_id
UPDATE users SET role_id = 3 WHERE role = 'Candidate' AND role_id IS NULL;
UPDATE users SET role_id = 2 WHERE role = 'HiringManager' AND role_id IS NULL;
UPDATE users SET role_id = 1 WHERE role = 'SuperAdmin' AND role_id IS NULL;

-- Create candidate profiles for existing candidates who don't have one
INSERT INTO candidate_profiles (user_id, full_name, created_at, updated_at)
SELECT 
    u.id,
    CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as full_name,
    NOW(),
    NOW()
FROM users u
LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
WHERE u.role = 'Candidate' 
AND u.deleted_at IS NULL
AND cp.id IS NULL;

-- Create default job form fields
INSERT INTO job_form_fields (input_type, label, is_required, validation_rules) VALUES
('text', 'First Name', true, '{"minLength": 2, "maxLength": 50}'),
('text', 'Last Name', true, '{"minLength": 2, "maxLength": 50}'),
('email', 'Email', true, '{"pattern": "^[^@]+@[^@]+\\\\.[^@]+$"}'),
('tel', 'Phone Number', false, '{"pattern": "^[+]?[0-9]{10,15}$"}'),
('textarea', 'Cover Letter', false, '{"maxLength": 5000}'),
('file', 'Resume', true, '{"fileTypes": ["pdf", "doc", "docx"], "maxSize": 5242880}')
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- Set default job status for existing jobs
UPDATE jobs SET status = 'active' WHERE status IN ('draft', 'published') AND 
status_id IS NULL;

COMMIT;
