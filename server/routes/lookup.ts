import { RequestHandler } from 'express';
import { executeQuery, executeSingleQuery } from '../config/database';

// Get job statuses
export const handleGetJobStatuses: RequestHandler = async (_req, res) => {
  try {
    const jobStatuses = await executeQuery<any>(
      'SELECT id, name FROM job_statuses ORDER BY name'
    );
    res.json(jobStatuses);
  } catch (error) {
    console.error('Error fetching job statuses:', error);
    res.status(500).json({ message: 'Failed to fetch job statuses' });
  }
};

// Get job types
export const handleGetJobTypes: RequestHandler = async (_req, res) => {
  try {
    const jobTypes = await executeQuery<any>(
      'SELECT id, name FROM job_types ORDER BY name'
    );
    res.json(jobTypes);
  } catch (error) {
    console.error('Error fetching job types:', error);
    res.status(500).json({ message: 'Failed to fetch job types' });
  }
};

// Get experience levels
export const handleGetExperienceLevels: RequestHandler = async (_req, res) => {
  try {
    const experienceLevels = await executeQuery<any>(
      'SELECT id, name FROM job_experience_levels ORDER BY name'
    );
    res.json(experienceLevels);
  } catch (error) {
    console.error('Error fetching experience levels:', error);
    res.status(500).json({ message: 'Failed to fetch experience levels' });
  }
};

// Get companies (not in new schema, return empty array)
export const handleGetCompanies: RequestHandler = async (_req, res) => {
  try {
    // Companies table doesn't exist in new schema, return empty array
    res.json([]);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
};

// Get departments
export const handleGetDepartments: RequestHandler = async (_req, res) => {
  try {
    const departments = await executeQuery<any>(
      'SELECT id, name FROM system_departments ORDER BY name'
    );
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
};

// Get application statuses
export const handleGetApplicationStatuses: RequestHandler = async (_req, res) => {
  try {
    const applicationStatuses = await executeQuery<any>(
      'SELECT id, name FROM application_statuses ORDER BY name'
    );
    res.json(applicationStatuses);
  } catch (error) {
    console.error('Error fetching application statuses:', error);
    res.status(500).json({ message: 'Failed to fetch application statuses' });
  }
};

// Get skills with optional search and approval filter
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

    const skills = await executeQuery<any>(query, params);
    
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ message: 'Failed to fetch skills' });
  }
};

// Get industries (not in new schema, return empty array)
export const handleGetIndustries: RequestHandler = async (_req, res) => {
  try {
    // Industries table doesn't exist in new schema, return empty array
    res.json([]);
  } catch (error) {
    console.error('Error fetching industries:', error);
    res.status(500).json({ message: 'Failed to fetch industries' });
  }
};

// Get countries (not in new schema, return empty array)
export const handleGetCountries: RequestHandler = async (_req, res) => {
  try {
    // Countries table doesn't exist in new schema, return empty array
    res.json([]);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ message: 'Failed to fetch countries' });
  }
};

// Get cities by country (not in new schema, return empty array)
export const handleGetCities: RequestHandler = async (_req, res) => {
  try {
    // Cities table doesn't exist in new schema, return empty array
    res.json([]);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ message: 'Failed to fetch cities' });
  }
};

// Get areas (simplified for new schema)
export const handleGetAreas: RequestHandler = async (_req, res) => {
  try {
    const areas = await executeQuery<any>(
      'SELECT id, name FROM system_areas ORDER BY name'
    );
    res.json(areas);
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ message: 'Failed to fetch areas' });
  }
};

// Create new skill (pending approval)
export const handleCreateSkill: RequestHandler = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    // Check if skill already exists
    const existingSkill = await executeQuery<any>(
      'SELECT id FROM system_skills WHERE name = ?',
      [name.trim()]
    );

    if (existingSkill.length > 0) {
      return res.status(409).json({ message: 'Skill already exists' });
    }

    // Insert new skill as pending approval
    const result = await executeSingleQuery(
      'INSERT INTO system_skills (name, is_approved) VALUES (?, FALSE)',
      [name.trim()]
    );

    const newSkill = await executeQuery<any>(
      'SELECT id, name, is_approved FROM system_skills WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newSkill[0]);
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ message: 'Failed to create skill' });
  }
};
