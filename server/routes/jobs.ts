import { RequestHandler } from 'express';
import { executeQuery, executeSingleQuery, findOne } from '../config/database';
import { AuthRequest } from '../middleware/auth';
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
             c.name as company_name,
             d.name as department_name,
             el.name as experience_level_name,
             jt.name as job_type_name,
             js.name as status_name,
             u_created.email as created_by_email,
             u_hiring.email as hiring_manager_email
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN departments d ON j.department_id = d.id
      LEFT JOIN experience_levels el ON j.experience_level_id = el.id
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN job_statuses js ON j.status_id = js.id
      LEFT JOIN users u_created ON j.created_by_user_id = u_created.id
      LEFT JOIN users u_hiring ON j.hiring_manager_id = u_hiring.id
      WHERE j.deleted_at IS NULL
    `;

    const params: any[] = [];

    // Apply filters
    if (req.query.search) {
      query += ' AND (j.title LIKE ? OR j.description LIKE ?)';
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

    if (req.query.company_id) {
      query += ' AND j.company_id = ?';
      params.push(parseInt(req.query.company_id as string));
    }

    query += ` ORDER BY j.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const jobs = await executeQuery<any>(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM jobs j
      WHERE j.deleted_at IS NULL
    `;

    const countParams: any[] = [];
    let countFilterQuery = '';

    if (req.query.search) {
      countFilterQuery += ' AND (j.title LIKE ? OR j.description LIKE ?)';
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

    if (req.query.company_id) {
      countFilterQuery += ' AND j.company_id = ?';
      countParams.push(parseInt(req.query.company_id as string));
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
             c.name as company_name,
             d.name as department_name,
             el.name as experience_level_name,
             jt.name as job_type_name,
             js.name as status_name,
             u_created.email as created_by_email,
             u_hiring.email as hiring_manager_email
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN departments d ON j.department_id = d.id
      LEFT JOIN experience_levels el ON j.experience_level_id = el.id
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN job_statuses js ON j.status_id = js.id
      LEFT JOIN users u_created ON j.created_by_user_id = u_created.id
      LEFT JOIN users u_hiring ON j.hiring_manager_id = u_hiring.id
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
      SELECT jff.*, 
             it.id as input_type_id,
             it.name as input_type_name
      FROM job_form_fields jff
      LEFT JOIN input_types it ON jff.input_type_id = it.id
      WHERE jff.job_id = ?
      ORDER BY jff.sort_order
    `, [jobId]);

    // Get options for each field separately
    for (const field of formFields) {
      const options = await executeQuery<any>(`
        SELECT id, option_label, option_value, sort_order
        FROM job_form_field_options
        WHERE job_form_field_id = ?
        ORDER BY sort_order
      `, [field.id]);
      
      field.options = options;
      field.input_type = {
        id: field.input_type_id,
        name: field.input_type_name
      };
    }

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

// Create new job
export const handleCreateJob: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const jobData: CreateJobRequest = req.body;

    console.log('Create job request headers:', req.headers);
    console.log('Create job request body:', jobData);
    console.log('Create job raw body:', req.body);

    // Validate required fields
    if (!jobData || !jobData.title || !jobData.company_id || !jobData.department_id || 
        !jobData.experience_level_id || !jobData.job_type_id || !jobData.description) {
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
      INSERT INTO jobs (
        title, created_by_user_id, hiring_manager_id, company_id, 
        department_id, experience_level_id, job_type_id, status_id, 
        description, key_responsibilities, requirements, benefits, 
        salary_range, location_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      jobData.title,
      req.user.id,
      jobData.hiring_manager_id || req.user.id,
      jobData.company_id,
      jobData.department_id,
      jobData.experience_level_id,
      jobData.job_type_id,
      defaultStatusId,
      jobData.description,
      jobData.key_responsibilities,
      jobData.requirements,
      jobData.benefits,
      jobData.salary_range,
      jobData.location_text
    ]);

    const jobId = insertResult.insertId;

    // Create form fields if provided
    if (jobData.form_fields && jobData.form_fields.length > 0) {
      for (const field of jobData.form_fields) {
        const fieldResult = await executeSingleQuery(`
          INSERT INTO job_form_fields (job_id, input_type_id, label, name, is_required, sort_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          jobId,
          field.input_type_id,
          field.label,
          field.name,
          field.is_required,
          field.sort_order
        ]);

        const fieldId = fieldResult.insertId;

        // Create field options if provided
        if (field.options && field.options.length > 0) {
          for (const option of field.options) {
            await executeSingleQuery(`
              INSERT INTO job_form_field_options (job_form_field_id, option_label, option_value, sort_order)
              VALUES (?, ?, ?, ?)
            `, [fieldId, option.option_label, option.option_value, option.sort_order]);
          }
        }
      }
    }

    // Return the created job
    const createdJob = await findOne<any>(`
      SELECT j.*, 
             c.name as company_name,
             d.name as department_name,
             el.name as experience_level_name,
             jt.name as job_type_name,
             js.name as status_name
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN departments d ON j.department_id = d.id
      LEFT JOIN experience_levels el ON j.experience_level_id = el.id
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
      SELECT created_by_user_id, hiring_manager_id
      FROM jobs
      WHERE id = ? AND deleted_at IS NULL
    `, [jobId]);

    if (!existingJob) {
      return res.status(404).json({
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Check permissions (SuperAdmin or creator/hiring manager)
    const userRole = req.user.role?.name;
    const canEdit = userRole === 'SuperAdmin' || 
                   existingJob.created_by_user_id === req.user.id || 
                   existingJob.hiring_manager_id === req.user.id;

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
    if (updateData.description) {
      updateFields.push('description = ?');
      updateParams.push(updateData.description);
    }
    if (updateData.key_responsibilities) {
      updateFields.push('key_responsibilities = ?');
      updateParams.push(updateData.key_responsibilities);
    }
    if (updateData.requirements) {
      updateFields.push('requirements = ?');
      updateParams.push(updateData.requirements);
    }
    if (updateData.benefits) {
      updateFields.push('benefits = ?');
      updateParams.push(updateData.benefits);
    }
    if (updateData.salary_range) {
      updateFields.push('salary_range = ?');
      updateParams.push(updateData.salary_range);
    }
    if (updateData.location_text) {
      updateFields.push('location_text = ?');
      updateParams.push(updateData.location_text);
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
      UPDATE jobs
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateParams);

    // Return updated job
    const updatedJob = await findOne<any>(`
      SELECT j.*, 
             c.name as company_name,
             d.name as department_name,
             el.name as experience_level_name,
             jt.name as job_type_name,
             js.name as status_name
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN departments d ON j.department_id = d.id
      LEFT JOIN experience_levels el ON j.experience_level_id = el.id
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
      UPDATE jobs
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
      FROM jobs j
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
