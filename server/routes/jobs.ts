// server/routes/jobs.ts
import { RequestHandler } from 'express';
import { executeQuery, executeSingleQuery, findOne, toMySQLJSON, fromMySQLJSON } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/checkRole';
import { Job, CreateJobRequest, UpdateJobRequest, PaginatedResponse, JobFormField } from '@shared/api';

// Get all jobs with filters and pagination
export const handleGetJobs: RequestHandler = async (req: AuthRequest, res) => {
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

    // For public access, only show published jobs
    if (!req.user) {
      query += ' AND j.status_id = (SELECT id FROM job_statuses WHERE name = "Published")';
    }

    query += ` ORDER BY j.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const jobs = await executeQuery<any>(query, params);

    // Fetch form fields for each job
    const jobsWithFields = await Promise.all(
      jobs.map(async (job) => {
        let form_fields: JobFormField[] = [];
        
        // Handle JSON form field IDs properly
        if (job.form_field_id) {
          try {
            const formFieldIds = typeof job.form_field_id === 'string' 
              ? JSON.parse(job.form_field_id) 
              : job.form_field_id;
            
            if (Array.isArray(formFieldIds) && formFieldIds.length > 0) {
              const placeholders = formFieldIds.map(() => '?').join(',');
              form_fields = await executeQuery<JobFormField>(
                `SELECT id, input_type, label FROM job_form_fields WHERE id IN (${placeholders})`,
                formFieldIds
              );
            }
          } catch (error) {
            console.error('Error parsing form field IDs:', error);
          }
        }
        
        return {
          ...job,
          form_fields,
          form_field_id: undefined // Remove from response
        };
      })
    );

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM job_posts j
      WHERE j.deleted_at IS NULL
    `;
    const countParams: any[] = [];

    if (req.query.search) {
      countQuery += ' AND (j.title LIKE ? OR j.summary LIKE ?)';
      countParams.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    if (req.query.department_id) {
      countQuery += ' AND j.department_id = ?';
      countParams.push(parseInt(req.query.department_id as string));
    }

    if (req.query.experience_level_id) {
      countQuery += ' AND j.experience_level_id = ?';
      countParams.push(parseInt(req.query.experience_level_id as string));
    }

    if (req.query.job_type_id) {
      countQuery += ' AND j.job_type_id = ?';
      countParams.push(parseInt(req.query.job_type_id as string));
    }

    if (!req.user) {
      countQuery += ' AND j.status_id = (SELECT id FROM job_statuses WHERE name = "Published")';
    }

    const totalResult = await findOne<{ total: number }>(countQuery, countParams);

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
export const handleGetJob: RequestHandler = async (req: AuthRequest, res) => {
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

    // Check if job is published for public access
    if (!req.user && job.status_name !== 'Published') {
      return res.status(404).json({
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Fetch associated form fields
    let form_fields: JobFormField[] = [];
    
    if (job.form_field_id) {
      try {
        const formFieldIds = typeof job.form_field_id === 'string' 
          ? JSON.parse(job.form_field_id) 
          : job.form_field_id;
        
        if (Array.isArray(formFieldIds) && formFieldIds.length > 0) {
          const placeholders = formFieldIds.map(() => '?').join(',');
          form_fields = await executeQuery<JobFormField>(
            `SELECT id, input_type, label FROM job_form_fields WHERE id IN (${placeholders})`,
            formFieldIds
          );
        }
      } catch (error) {
        console.error('Error parsing form field IDs:', error);
      }
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
        salary_min, salary_max, deadline, form_field_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      jobData.title,
      jobData.department_id,
      jobData.experience_level_id,
      jobData.job_type_id,
      jobData.status_id || defaultStatusId,
      jobData.summary,
      jobData.responsibilities || null,
      jobData.requirements || null,
      jobData.benefits || null,
      jobData.salary_min || null,
      jobData.salary_max || null,
      jobData.deadline || null,
      formFieldJson
    ]);

    // Fetch the newly created job with all associations
    const newJob = await findOne<any>(`
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
    `, [insertResult.insertId]);

    res.status(201).json(newJob);

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to create job',
      code: 'JOB_CREATION_FAILED'
    });
  }
};

// Update job
export const handleUpdateJob: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const jobData: Partial<CreateJobRequest> = req.body;
    const user = req.user;

    if (!jobId) {
      return res.status(400).json({
        message: 'Job ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if job exists and user has permission
    const existingJob = await findOne<any>(`
      SELECT j.*, u.role_id
      FROM job_posts j
      JOIN users u ON j.created_by = u.id
      WHERE j.id = ? AND j.deleted_at IS NULL
    `, [jobId]);

    if (!existingJob) {
      return res.status(404).json({
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Check permissions - only SuperAdmin or the job creator can update
    if (user?.role?.name !== 'SuperAdmin' && existingJob.created_by !== user?.id) {
      return res.status(403).json({
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    const allowedFields = [
      'title', 'department_id', 'experience_level_id', 'job_type_id',
      'status_id', 'summary', 'responsibilities', 'requirements',
      'benefits', 'salary_min', 'salary_max', 'deadline'
    ];

    allowedFields.forEach(field => {
      if (jobData[field as keyof typeof jobData] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(jobData[field as keyof typeof jobData]);
      }
    });

    // Handle form field IDs
    if (jobData.form_field_ids) {
      const formFieldJson = jobData.form_field_ids.length > 0 ? toMySQLJSON(jobData.form_field_ids) : null;
      updateFields.push('form_field_id = ?');
      updateValues.push(formFieldJson);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        message: 'No valid fields to update',
        code: 'VALIDATION_ERROR'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(jobId);

    const updateQuery = `
      UPDATE job_posts 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await executeSingleQuery(updateQuery, updateValues);

    // Fetch updated job
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
      message: error instanceof Error ? error.message : 'Failed to update job',
      code: 'JOB_UPDATE_FAILED'
    });
  }
};

// Delete job
export const handleDeleteJob: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const jobId = parseInt(req.params.id);

    if (!jobId) {
      return res.status(400).json({
        message: 'Job ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Soft delete the job
    const result = await executeSingleQuery(`
      UPDATE job_posts 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `, [jobId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    res.json({
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to delete job',
      code: 'JOB_DELETE_FAILED'
    });
  }
};

// Get job statistics
export const handleGetJobStats: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    
    // Base query for job statistics
    let baseQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN js.name = 'Published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN js.name = 'Draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN js.name = 'Closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN j.deadline < CURDATE() AND js.name = 'Published' THEN 1 ELSE 0 END) as expired
      FROM job_posts j
      LEFT JOIN job_statuses js ON j.status_id = js.id
      WHERE j.deleted_at IS NULL
    `;

    // If not SuperAdmin, filter by user's jobs
    if (user?.role?.name !== 'SuperAdmin') {
      baseQuery += ` AND j.created_by = ${user?.id}`;
    }

    const stats = await findOne<any>(baseQuery);

    // Get applications per job
    const applicationsQuery = `
      SELECT 
        j.id,
        j.title,
        COUNT(a.id) as application_count
      FROM job_posts j
      LEFT JOIN applications a ON j.id = a.job_id AND a.deleted_at IS NULL
      WHERE j.deleted_at IS NULL
      ${user?.role?.name !== 'SuperAdmin' ? `AND j.created_by = ${user?.id}` : ''}
      GROUP BY j.id, j.title
      ORDER BY application_count DESC
      LIMIT 10
    `;

    const jobApplications = await executeQuery<any>(applicationsQuery);

    res.json({
      total: stats?.total || 0,
      published: stats?.published || 0,
      draft: stats?.draft || 0,
      closed: stats?.closed || 0,
      expired: stats?.expired || 0,
      topJobs: jobApplications.map(job => ({
        id: job.id,
        title: job.title,
        applicationCount: job.application_count
      }))
    });

  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch job statistics',
      code: 'STATS_FETCH_FAILED'
    });
  }
};
