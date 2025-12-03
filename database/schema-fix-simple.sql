-- Career Portal - Database Schema Fix (Simplified)
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
