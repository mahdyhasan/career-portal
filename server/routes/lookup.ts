// server/routes/lookup.ts
import { RequestHandler } from 'express';
import { executeQuery, executeSingleQuery, findOne } from '../config/database';
import { 
  JobFormField, 
  ApplicationStatus, 
  JobStatus, 
  JobType, 
  ExperienceLevel,
  Department,
  Area,
  Skill
} from '@shared/api';

// Get job statuses (from job_statuses table)
export const handleGetJobStatuses: RequestHandler = async (_req, res) => {
  try {
    const jobStatuses = await executeQuery<JobStatus>(
      'SELECT id, name FROM job_statuses ORDER BY id'
    );
    res.json(jobStatuses);
  } catch (error) {
    console.error('Error fetching job statuses:', error);
    res.status(500).json({ 
      message: 'Failed to fetch job statuses',
      code: 'FETCH_JOB_STATUSES_FAILED'
    });
  }
};

// Get job types (from job_types table)
export const handleGetJobTypes: RequestHandler = async (_req, res) => {
  try {
    const jobTypes = await executeQuery<JobType>(
      'SELECT id, name FROM job_types ORDER BY id'
    );
    res.json(jobTypes);
  } catch (error) {
    console.error('Error fetching job types:', error);
    res.status(500).json({ 
      message: 'Failed to fetch job types',
      code: 'FETCH_JOB_TYPES_FAILED'
    });
  }
};

// Get experience levels (from job_experience_levels table)
export const handleGetExperienceLevels: RequestHandler = async (_req, res) => {
  try {
    const experienceLevels = await executeQuery<ExperienceLevel>(
      'SELECT id, name FROM job_experience_levels ORDER BY id'
    );
    res.json(experienceLevels);
  } catch (error) {
    console.error('Error fetching experience levels:', error);
    res.status(500).json({ 
      message: 'Failed to fetch experience levels',
      code: 'FETCH_EXPERIENCE_LEVELS_FAILED'
    });
  }
};

// Get departments (from system_departments table)
export const handleGetDepartments: RequestHandler = async (_req, res) => {
  try {
    const departments = await executeQuery<Department>(
      'SELECT id, name FROM system_departments ORDER BY name'
    );
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ 
      message: 'Failed to fetch departments',
      code: 'FETCH_DEPARTMENTS_FAILED'
    });
  }
};

// Get application statuses (from application_statuses table)
export const handleGetApplicationStatuses: RequestHandler = async (_req, res) => {
  try {
    const applicationStatuses = await executeQuery<ApplicationStatus>(
      'SELECT id, name FROM application_statuses ORDER BY id'
    );
    res.json(applicationStatuses);
  } catch (error) {
    console.error('Error fetching application statuses:', error);
    res.status(500).json({ 
      message: 'Failed to fetch application statuses',
      code: 'FETCH_APPLICATION_STATUSES_FAILED'
    });
  }
};

// Get skills (from system_skills table)
export const handleGetSkills: RequestHandler = async (req, res) => {
  try {
    const { search, approved } = req.query;
    let query = 'SELECT id, name, is_approved FROM system_skills';
    const params: any[] = [];
    const conditions: string[] = [];

    if (search && typeof search === 'string') {
      conditions.push('name LIKE ?');
      params.push(`%${search}%`);
    }

    if (approved === 'true') {
      conditions.push('is_approved = TRUE');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name LIMIT 50';

    const skills = await executeQuery<Skill>(query, params);
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ 
      message: 'Failed to fetch skills',
      code: 'FETCH_SKILLS_FAILED'
    });
  }
};

// Get areas (from system_areas table)
export const handleGetAreas: RequestHandler = async (_req, res) => {
  try {
    const areas = await executeQuery<Area>(
      'SELECT id, name FROM system_areas ORDER BY name'
    );
    res.json(areas);
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ 
      message: 'Failed to fetch areas',
      code: 'FETCH_AREAS_FAILED'
    });
  }
};

// Create new skill (in system_skills table)
export const handleCreateSkill: RequestHandler = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Skill name is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if skill already exists
    const existingSkill = await findOne<Skill>(
      'SELECT id FROM system_skills WHERE name = ?',
      [name.trim()]
    );

    if (existingSkill) {
      return res.status(409).json({ 
        message: 'Skill already exists',
        code: 'DUPLICATE_RESOURCE'
      });
    }

    // Insert new skill as pending approval
    const result = await executeSingleQuery(
      'INSERT INTO system_skills (name, is_approved) VALUES (?, FALSE)',
      [name.trim()]
    );

    const newSkill = await findOne<Skill>(
      'SELECT id, name, is_approved FROM system_skills WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newSkill);
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ 
      message: 'Failed to create skill',
      code: 'CREATE_SKILL_FAILED'
    });
  }
};

// DEPRECATED: Companies table doesn't exist in current schema
export const handleGetCompanies: RequestHandler = async (_req, res) => {
  res.json([]); // Return empty array for backward compatibility
};

// DEPRECATED: Industries table doesn't exist in current schema
export const handleGetIndustries: RequestHandler = async (_req, res) => {
  res.json([]); // Return empty array for backward compatibility
};

// DEPRECATED: Countries table doesn't exist in current schema
export const handleGetCountries: RequestHandler = async (_req, res) => {
  res.json([]); // Return empty array for backward compatibility
};

// DEPRECATED: Cities table doesn't exist in current schema
export const handleGetCities: RequestHandler = async (_req, res) => {
  res.json([]); // Return empty array for backward compatibility
};

// Get job form fields (from job_form_fields table)
export const handleGetJobFormFields: RequestHandler = async (_req, res) => {
  try {
    const jobFormFields = await executeQuery<JobFormField>(
      'SELECT id, input_type, label FROM job_form_fields ORDER BY label'
    );
    res.json(jobFormFields);
  } catch (error) {
    console.error('Error fetching job form fields:', error);
    res.status(500).json({ 
      message: 'Failed to fetch job form fields',
      code: 'FETCH_JOB_FORM_FIELDS_FAILED'
    });
  }
};