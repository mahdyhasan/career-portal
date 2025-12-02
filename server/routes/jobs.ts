import { RequestHandler } from 'express';
import { executeQuery, executeSingleQuery, findOne } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireJobManagement, requireAuthenticated } from '../middleware/checkRole';
import { 
  Job, 
  CreateJobRequest, 
  JobStatus, 
  JobType, 
  Company, 
  Department, 
  ExperienceLevel,
  PaginatedResponse,
  JobFormField
} from '@shared/api';

// Get all jobs with filters and pagination
export const handleGetJobs: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    let query = `
      SELECT j.*, 
             d.name as department_name,
             el.name as experience_level_name,
             jt.name as job_type_name,
             js.name as status_name
      FROM job_posts j
      LEFT JOIN system_departments d ON j.department_id = d.id
      LEFT JOIN job_experience_levels el ON j.experience_level_id = el.id
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN job_statuses js ON j.status_id = js.id
      WHERE j.deleted_at IS NULL
    `;

    const params: any[] = [];

    // Apply filters
    if (req.query.search) {
      query += ' AND (j.title LIKE ? OR j.summary LIKE ?)';
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    if (req.query.job_type_id) {
      query += ' AND j.job_type_id = ?';
      params.push(parseInt(req.query.job_type_id as string));
    }

    if (req.query.experience_level_id) {
      query += ' AND j.experience_level_id = ?';
      params.push(parseInt(req.query.experience_level_id as string));
    }

    query += ` ORDER BY j.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const jobs = await executeQuery<any>(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM job_posts j
      WHERE j.deleted_at IS NULL
    `;

    const countParams: any[] = [];
    let countFilterQuery = '';

    if (req.query.search) {
      countFilterQuery += ' AND (j.title LIKE ? OR j.summary LIKE ?)';
      countParams.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    if (req.query.job_type_id) {
      countFilterQuery += ' AND j.job_type_id = ?';
      countParams.push(parseInt(req.query.job_type_id as string));
    }

    if (req.query.experience_level_id) {
      countFilterQuery += ' AND j.experience_level_id = ?';
      countParams.push(parseInt(req.query.experience_level_id as string));
    }


    const totalResult = await findOne<{ total: number }>(
      countQuery + countFilterQuery, 
      countParams
    );

    const response: PaginatedResponse<Job> = {
      data: jobs,
      total: totalResult?.total || 0,
      page,
      limit,
      totalPages: Math.ceil((totalResult?.total || 0) / limit)
    };

    res.json(response);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      message: 'Failed to fetch jobs',
      code: 'FETCH_JOBS_FAILED'
    });
  }
};

// Get job by ID with form fields
export const handleGetJob: RequestHandler = async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    
    if (!jobId) {
      return res.status(400).json({
        message: 'Job ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const job = await findOne<any>(`
      SELECT j.*, 
             d.name as department_name,
             el.name as experience_level_name,
             jt.name as job_type_name,
             js.name as status_name
      FROM job_posts j
      LEFT JOIN system_departments d ON j.department_id = d.id
      LEFT JOIN job_experience_levels el ON j.experience_level_id = el.id
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN job_statuses js ON j.status_id = js.id
      WHERE j.id = ? AND j.deleted_at IS NULL
    `, [jobId]);

    if (!job) {
      return res.status(404).json({
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Get form fields for this job
    const formFields = await executeQuery<any>(`
      SELECT *
      FROM job_form_fields
      WHERE job_id = ?
    `, [jobId]);

    job.form_fields = formFields;

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      message: 'Failed to fetch job',
      code: 'FETCH_JOB_FAILED'
    });
  }
};

// Create new job - PROTECTED: Only HiringManager and SuperAdmin can create jobs
export const handleCreateJob: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const jobData: CreateJobRequest = req.body;

    console.log('Create job request headers:', req.headers);
    console.log('Create job request body:', jobData);
    console.log('Create job raw body:', req.body);

    // Validate required fields
    if (!jobData || !jobData.title || !jobData.department_id || 
        !jobData.experience_level_id || !jobData.job_type_id || !jobData.summary) {
      return res.status(400).json({
        message: 'Required fields are missing',
        code: 'VALIDATION_ERROR',
        details: jobData
      });
    }

    // Get default status ID (Draft)
    const statusResult = await findOne<{ id: number }>(`
      SELECT id FROM job_statuses WHERE name = 'Draft' LIMIT 1
    `);
    const defaultStatusId = statusResult?.id || 1;

    const insertResult = await executeSingleQuery(`
      INSERT INTO job_posts (
        title, department_id, experience_level_id, job_type_id, status_id, 
        summary, responsibilities, requirements, benefits, 
        salary_min, salary_max, deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      jobData.title,
      jobData.department_id,
      jobData.experience_level_id,
      jobData.job_type_id,
      defaultStatusId,
      jobData.summary,
      jobData.responsibilities,
      jobData.requirements,
      jobData.benefits,
      jobData.salary_min,
      jobData.salary_max,
      jobData.deadline
    ]);

    const jobId = insertResult.insertId;

    // Create form fields if provided
    if (jobData.form_fields && jobData.form_fields.length > 0) {
      for (const field of jobData.form_fields) {
        const fieldResult = await executeSingleQuery(`
          INSERT INTO job_form_fields (job_id, input_type, label, is_required)
          VALUES (?, ?, ?, ?)
        `, [
          jobId,
          field.input_type,
          field.label,
          field.is_required
        ]);
      }
    }

    // Return the created job
    const createdJob = await findOne<any>(`
      SELECT j.*, 
             d.name as department_name,
             el.name as experience_level_name,
             jt.name as job_type_name,
             js.name as status_name
      FROM job_posts j
      LEFT JOIN system_departments d ON j.department_id = d.id
      LEFT JOIN job_experience_levels el ON j.experience_level_id = el.id
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN job_statuses js ON j.status_id = js.id
      WHERE j.id = ?
    `, [jobId]);

    res.status(201).json(createdJob);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      message: 'Failed to create job',
      code: 'CREATE_JOB_FAILED'
    });
  }
};

// Update job
export const handleUpdateJob: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const jobId = parseInt(req.params.id);
    const updateData = req.body;

    if (!jobId) {
      return res.status(400).json({
        message: 'Job ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if job exists and user has permission
    const existingJob = await findOne<any>(`
      SELECT id
      FROM job_posts
      WHERE id = ? AND deleted_at IS NULL
    `, [jobId]);

    if (!existingJob) {
      return res.status(404).json({
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Check permissions (SuperAdmin only for now since new schema doesn't have created_by_user_id)
    const userRole = req.user.role?.name;
    const canEdit = userRole === 'SuperAdmin';

    if (!canEdit) {
      return res.status(403).json({
        message: 'Insufficient permissions to edit this job',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateParams = [];

    if (updateData.title) {
      updateFields.push('title = ?');
      updateParams.push(updateData.title);
    }
    if (updateData.summary) {
      updateFields.push('summary = ?');
      updateParams.push(updateData.summary);
    }
    if (updateData.responsibilities) {
      updateFields.push('responsibilities = ?');
      updateParams.push(updateData.responsibilities);
    }
    if (updateData.requirements) {
      updateFields.push('requirements = ?');
      updateParams.push(updateData.requirements);
    }
    if (updateData.benefits) {
      updateFields.push('benefits = ?');
      updateParams.push(updateData.benefits);
    }
    if (updateData.salary_min) {
      updateFields.push('salary_min = ?');
      updateParams.push(updateData.salary_min);
    }
    if (updateData.salary_max) {
      updateFields.push('salary_max = ?');
      updateParams.push(updateData.salary_max);
    }
    if (updateData.deadline) {
      updateFields.push('deadline = ?');
      updateParams.push(updateData.deadline);
    }
    if (updateData.status_id) {
      updateFields.push('status_id = ?');
      updateParams.push(updateData.status_id);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        message: 'No valid fields to update',
        code: 'VALIDATION_ERROR'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(jobId);

    await executeQuery(`
      UPDATE job_posts
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateParams);

    // Return updated job
    const updatedJob = await findOne<any>(`
      SELECT j.*, 
             d.name as department_name,
             el.name as experience_level_name,
             jt.name as job_type_name,
             js.name as status_name
      FROM job_posts j
      LEFT JOIN system_departments d ON j.department_id = d.id
      LEFT JOIN job_experience_levels el ON j.experience_level_id = el.id
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN job_statuses js ON j.status_id = js.id
      WHERE j.id = ?
    `, [jobId]);

    res.json(updatedJob);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      message: 'Failed to update job',
      code: 'UPDATE_JOB_FAILED'
    });
  }
};

// Delete job
export const handleDeleteJob: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const jobId = parseInt(req.params.id);

    if (!jobId) {
      return res.status(400).json({
        message: 'Job ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Only SuperAdmin can delete jobs
    if (req.user.role?.name !== 'SuperAdmin') {
      return res.status(403).json({
        message: 'Only SuperAdmin can delete jobs',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    await executeQuery(`
      UPDATE job_posts
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [jobId]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      message: 'Failed to delete job',
      code: 'DELETE_JOB_FAILED'
    });
  }
};

// Get job statistics
export const handleGetJobStats: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role?.name;
    let whereClause = 'WHERE j.deleted_at IS NULL';

    // Hiring managers and admins see their own jobs, SuperAdmin sees all
    if (userRole !== 'SuperAdmin') {
      whereClause += ' AND (j.created_by_user_id = ? OR j.hiring_manager_id = ?)';
    }

    const params = userRole === 'SuperAdmin' ? [] : [req.user.id, req.user.id];

    const stats = await findOne<any>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN js.name = 'Published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN js.name = 'Draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN js.name = 'Closed' THEN 1 ELSE 0 END) as closed
      FROM job_posts j
      LEFT JOIN job_statuses js ON j.status_id = js.id
      ${whereClause}
    `, params);

    res.json(stats);
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch job statistics',
      code: 'GET_STATS_FAILED'
    });
  }
};
