// server/routes/jobs.ts
import { RequestHandler } from 'express';
import { executeQuery, executeSingleQuery, findOne, toMySQLJSON, fromMySQLJSON } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/checkRole';
import { Job, CreateJobRequest, UpdateJobRequest, PaginatedResponse, JobFormField } from '@shared/api';

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

    if (req.query.department_id) {
      query += ' AND j.department_id = ?';
      params.push(parseInt(req.query.department_id as string));
    }

    if (req.query.experience_level_id) {
      query += ' AND j.experience_level_id = ?';
      params.push(parseInt(req.query.experience_level_id as string));
    }

    if (req.query.job_type_id) {
      query += ' AND j.job_type_id = ?';
      params.push(parseInt(req.query.job_type_id as string));
    }

    if (req.query.status_id) {
      query += ' AND j.status_id = ?';
      params.push(parseInt(req.query.status_id as string));
    }

    query += ` ORDER BY j.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const jobs = await executeQuery<any>(query, params);

    // Fetch form fields for each job
    const jobsWithFields = await Promise.all(
      jobs.map(async (job) => {
        const formFieldIds = fromMySQLJSON<number[]>(job.form_field_id) || 
                           (job.form_field_id_int ? [job.form_field_id_int] : []);
        
        let form_fields: JobFormField[] = [];
        if (formFieldIds && formFieldIds.length > 0) {
          const placeholders = formFieldIds.map(() => '?').join(',');
          form_fields = await executeQuery<JobFormField>(
            `SELECT id, input_type, label FROM job_form_fields WHERE id IN (${placeholders})`,
            formFieldIds
          );
        }

        return {
          ...job,
          form_fields,
          form_field_id: formFieldIds // Clean up response
        };
      })
    );

    // Get total count
    const totalResult = await findOne<{ total: number }>(`
      SELECT COUNT(*) as total
      FROM job_posts j
      WHERE j.deleted_at IS NULL
    `);

    const response: PaginatedResponse<Job> = {
      data: jobsWithFields,
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

// Get job by ID
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

    // Fetch associated form fields
    const formFieldIds = fromMySQLJSON<number[]>(job.form_field_id) || 
                       (job.form_field_id_int ? [job.form_field_id_int] : []);
    
    let form_fields: JobFormField[] = [];
    if (formFieldIds && formFieldIds.length > 0) {
      const placeholders = formFieldIds.map(() => '?').join(',');
      form_fields = await executeQuery<JobFormField>(
        `SELECT id, input_type, label FROM job_form_fields WHERE id IN (${placeholders})`,
        formFieldIds
      );
    }

    job.form_fields = form_fields;
    delete job.form_field_id_int; // Remove internal field

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
    const jobData: CreateJobRequest = req.body;

    // Validate required fields
    if (!jobData || !jobData.title || !jobData.department_id || 
        !jobData.experience_level_id || !jobData.job_type_id || !jobData.summary) {
      return res.status(400).json({
        message: 'Required fields are missing',
        code: 'VALIDATION_ERROR',
        details: {
          required: ['title', 'department_id', 'experience_level_id', 'job_type_id', 'summary']
        }
      });
    }

    // Get default status ID (Draft)
    const statusResult = await findOne<{ id: number }>(`
      SELECT id FROM job_statuses WHERE name = 'Draft' LIMIT 1
    `);
    const defaultStatusId = statusResult?.id || 1;

    // Handle form field IDs (store as JSON array)
    const formFieldIds = jobData.form_field_ids || [];
    const formFieldJson = formFieldIds.length > 0 ? toMySQLJSON(formFieldIds) : null;

    const insertResult = await executeSingleQuery(`
      INSERT INTO job_posts (
        title, department_id, experience_level_id, job_type_id, status_id, 
        summary, responsibilities, requirements, benefits, 
        salary_min, salary_max, deadline, form_field_id
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
      jobData.deadline,
      formFieldJson
    ]);

    const jobId = insertResult.insertId;

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

    // Fetch form fields
    if (formFieldIds.length > 0) {
      const placeholders = formFieldIds.map(() => '?').join(',');
      createdJob.form_fields = await executeQuery<JobFormField>(
        `SELECT id, input_type, label FROM job_form_fields WHERE id IN (${placeholders})`,
        formFieldIds
      );
    }

    delete createdJob.form_field_id_int;

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
    const updateData: UpdateJobRequest = req.body;

    if (!jobId) {
      return res.status(400).json({
        message: 'Job ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if job exists
    const existingJob = await findOne<any>(`
      SELECT id, status_id
      FROM job_posts
      WHERE id = ? AND deleted_at IS NULL
    `, [jobId]);

    if (!existingJob) {
      return res.status(404).json({
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Check permissions (SuperAdmin only)
    if (req.user.role?.name !== 'SuperAdmin') {
      return res.status(403).json({
        message: 'Only SuperAdmin can edit jobs',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateParams = [];

    if (updateData.title !== undefined) {
      updateFields.push('title = ?');
      updateParams.push(updateData.title);
    }
    if (updateData.summary !== undefined) {
      updateFields.push('summary = ?');
      updateParams.push(updateData.summary);
    }
    if (updateData.responsibilities !== undefined) {
      updateFields.push('responsibilities = ?');
      updateParams.push(updateData.responsibilities);
    }
    if (updateData.requirements !== undefined) {
      updateFields.push('requirements = ?');
      updateParams.push(updateData.requirements);
    }
    if (updateData.benefits !== undefined) {
      updateFields.push('benefits = ?');
      updateParams.push(updateData.benefits);
    }
    if (updateData.salary_min !== undefined) {
      updateFields.push('salary_min = ?');
      updateParams.push(updateData.salary_min);
    }
    if (updateData.salary_max !== undefined) {
      updateFields.push('salary_max = ?');
      updateParams.push(updateData.salary_max);
    }
    if (updateData.deadline !== undefined) {
      updateFields.push('deadline = ?');
      updateParams.push(updateData.deadline);
    }
    if (updateData.status_id !== undefined) {
      updateFields.push('status_id = ?');
      updateParams.push(updateData.status_id);
    }
    if (updateData.department_id !== undefined) {
      updateFields.push('department_id = ?');
      updateParams.push(updateData.department_id);
    }
    if (updateData.experience_level_id !== undefined) {
      updateFields.push('experience_level_id = ?');
      updateParams.push(updateData.experience_level_id);
    }
    if (updateData.job_type_id !== undefined) {
      updateFields.push('job_type_id = ?');
      updateParams.push(updateData.job_type_id);
    }
    if (updateData.form_field_ids !== undefined) {
      const formFieldJson = updateData.form_field_ids.length > 0 ? toMySQLJSON(updateData.form_field_ids) : null;
      updateFields.push('form_field_id = ?');
      updateParams.push(formFieldJson);
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

    // Fetch form fields
    const formFieldIds = fromMySQLJSON<number[]>(updatedJob.form_field_id) || 
                       (updatedJob.form_field_id_int ? [updatedJob.form_field_id_int] : []);
    
    if (formFieldIds && formFieldIds.length > 0) {
      const placeholders = formFieldIds.map(() => '?').join(',');
      updatedJob.form_fields = await executeQuery<JobFormField>(
        `SELECT id, input_type, label FROM job_form_fields WHERE id IN (${placeholders})`,
        formFieldIds
      );
    }

    delete updatedJob.form_field_id_int;

    res.json(updatedJob);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      message: 'Failed to update job',
      code: 'UPDATE_JOB_FAILED'
    });
  }
};

// Delete job (soft delete)
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

    // SuperAdmin sees all stats, others see nothing for now
    if (req.user.role?.name !== 'SuperAdmin') {
      return res.status(403).json({
        message: 'Only SuperAdmin can view stats',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const stats = await findOne<any>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN js.name = 'Published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN js.name = 'Draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN js.name = 'Closed' THEN 1 ELSE 0 END) as closed
      FROM job_posts j
      LEFT JOIN job_statuses js ON j.status_id = js.id
      WHERE j.deleted_at IS NULL
    `);

    res.json(stats || { total: 0, published: 0, draft: 0, closed: 0 });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch job statistics',
      code: 'GET_STATS_FAILED'
    });
  }
};