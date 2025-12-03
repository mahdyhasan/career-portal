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
AND (u.deleted_at IS NULL OR u.deleted_at IS NULL)
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
