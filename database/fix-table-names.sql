-- Fix table name mismatches between database and server code

-- Create views or rename existing tables to match server expectations

-- The database has these tables, but server code expects different names
-- Create views to map existing tables to expected names

-- Map skills -> system_skills (server expects system_skills)
CREATE OR REPLACE VIEW system_skills AS SELECT * FROM skills;

-- Map areas -> system_areas (server expects system_areas)  
CREATE OR REPLACE VIEW system_areas AS SELECT * FROM areas;

-- Map departments -> system_departments (server expects system_departments)
CREATE OR REPLACE VIEW system_departments AS SELECT * FROM departments;

-- Map jobs -> job_posts (server expects job_posts)
CREATE OR REPLACE VIEW job_posts AS 
SELECT 
    id,
    title,
    department_id,
    experience_level_id,
    job_type_id,
    status_id,
    summary,
    responsibilities,
    requirements,
    benefits,
    salary_min,
    salary_max,
    deadline,
    created_by,
    created_at,
    updated_at,
    deleted_at,
    NULL as form_field_id,
    NULL as description
FROM jobs;

-- Map education -> candidate_educations (server expects candidate_educations)
CREATE OR REPLACE VIEW candidate_educations AS 
SELECT 
    id,
    user_id as candidate_profile_id,
    institute_name,
    degree,
    major_subject,
    graduation_year,
    result,
    created_at,
    updated_at
FROM education;

-- Map achievements -> candidate_achievements (server expects candidate_achievements)
CREATE OR REPLACE VIEW candidate_achievements AS 
SELECT 
    id,
    user_id as candidate_profile_id,
    title,
    description,
    url,
    created_at,
    updated_at,
    issue_date
FROM achievements;

-- Create application statuses table (doesn't exist)
CREATE TABLE IF NOT EXISTS application_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Create job statuses table (doesn't exist)
CREATE TABLE IF NOT EXISTS job_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Create candidate_skills table (doesn't exist)
CREATE TABLE IF NOT EXISTS candidate_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_profile_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
    years_experience DECIMAL(3, 1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_candidate_skill (candidate_profile_id, skill_id),
    INDEX idx_candidate_profile_id (candidate_profile_id),
    INDEX idx_skill_id (skill_id)
);

-- Create candidate_attachments table (doesn't exist)
CREATE TABLE IF NOT EXISTS candidate_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_profile_id INT NOT NULL,
    file_type ENUM('resume', 'coverLetter', 'portfolio', 'CV', 'Certificate', 'Other') NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size_kb INT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_candidate_profile_id (candidate_profile_id),
    INDEX idx_file_type (file_type)
);

-- Create candidate_profiles table (doesn't exist)
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
    INDEX idx_user_id (user_id),
    INDEX idx_deleted_at (deleted_at)
);

-- Create job_form_fields table (doesn't exist)
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

-- Create application_answers table (doesn't exist)
CREATE TABLE IF NOT EXISTS application_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    job_form_field_id INT NOT NULL,
    answer_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_application_id (application_id),
    INDEX idx_job_form_field_id (job_form_field_id)
);
