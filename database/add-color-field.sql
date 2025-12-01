-- Add color field to application_statuses table
ALTER TABLE application_statuses 
ADD COLUMN color VARCHAR(20) DEFAULT '#6B7280' AFTER name;

-- Update existing application statuses with colors
UPDATE application_statuses SET color = '#EF4444' WHERE name = 'Applied';
UPDATE application_statuses SET color = '#F59E0B' WHERE name = 'Under Review';
UPDATE application_statuses SET color = '#3B82F6' WHERE name = 'Screening';
UPDATE application_statuses SET color = '#8B5CF6' WHERE name = 'Interview';
UPDATE application_statuses SET color = '#EC4899' WHERE name = 'Technical Assessment';
UPDATE application_statuses SET color = '#10B981' WHERE name = 'Offer';
UPDATE application_statuses SET color = '#EF4444' WHERE name = 'Rejected';
UPDATE application_statuses SET color = '#6B7280' WHERE name = 'Withdrawn';
