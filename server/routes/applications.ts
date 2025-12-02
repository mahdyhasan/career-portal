// server/routes/applications.ts
import { RequestHandler } from 'express';
import { executeQuery, executeSingleQuery, findOne, transaction } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { 
  Application, 
  ApplicationAnswer, 
  SubmitApplicationRequest, 
  UpdateApplicationStatusRequest,
  ApplicationStatus,
  JobFormField 
} from '@shared/api';

// Get applications (for candidates and hiring managers)
export const handleGetApplications: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    
    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Build base query
    let whereClause = 'WHERE a.deleted_at IS NULL';
    let queryParams: any[] = [];

    // Role-based filtering
    if (role === 'Candidate') {
      whereClause += ' AND a.candidate_user_id = ?';
      queryParams = [userId];
    } else if (role === 'HiringManager') {
      // Hiring managers can see all applications (no additional filter)
      // Could add department-based filtering later
    } else if (role !== 'SuperAdmin') {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get total count
    const countResult = await findOne<{ total: number }>(`
      SELECT COUNT(*) as total
      FROM applications a
      JOIN job_posts j ON a.job_id = j.id
      JOIN users u ON a.candidate_user_id = u.id
      ${whereClause}
    `, queryParams);

    // Get applications with details
    const applicationsResult = await executeQuery<any>(`
      SELECT 
        a.id,
        a.job_id,
        a.candidate_user_id,
        a.status_id,
        a.source,
        a.created_at,
        a.updated_at,
        j.title as job_title,
        j.summary as job_summary,
        j.department_id,
        j.experience_level_id,
        j.job_type_id,
        j.salary_min,
        j.salary_max,
        j.deadline,
        u.email as candidate_email,
        cp.full_name as candidate_name,
        aps.name as status_name
      FROM applications a
      JOIN job_posts j ON a.job_id = j.id
      JOIN users u ON a.candidate_user_id = u.id
      LEFT JOIN candidate_profiles cp ON a.candidate_user_id = cp.user_id
      LEFT JOIN application_statuses aps ON a.status_id = aps.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    // Transform results
    const applications = applicationsResult.map(app => ({
      id: app.id,
      job_id: app.job_id,
      candidate_user_id: app.candidate_user_id,
      source: app.source,
      created_at: app.created_at,
      updated_at: app.updated_at,
      job: {
        id: app.job_id,
        title: app.job_title,
        summary: app.job_summary,
        department_id: app.department_id,
        experience_level_id: app.experience_level_id,
        job_type_id: app.job_type_id,
        salary_min: app.salary_min,
        salary_max: app.salary_max,
        deadline: app.deadline
      },
      candidate: {
        id: app.candidate_user_id,
        email: app.candidate_email,
        full_name: app.candidate_name
      },
      status_id: app.status_id,
      status: {
        id: app.status_id,
        name: app.status_name
      }
    }));

    const response = {
      applications,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get single application by ID
export const handleGetApplication: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const applicationId = parseInt(req.params.id);

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (isNaN(applicationId)) {
      return res.status(400).json({ 
        message: 'Invalid application ID',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get application details
    const applicationResult = await findOne<any>(`
      SELECT 
        a.id,
        a.job_id,
        a.candidate_user_id,
        a.status_id,
        a.source,
        a.created_at,
        a.updated_at,
        j.title as job_title,
        j.summary as job_summary,
        j.department_id,
        j.experience_level_id,
        j.job_type_id,
        j.salary_min,
        j.salary_max,
        j.deadline,
        j.form_field_id,
        u.email as candidate_email,
        cp.full_name as candidate_name,
        cp.phone as candidate_phone,
        cp.linkedin_url as candidate_linkedin,
        cp.portfolio_url as candidate_portfolio,
        aps.name as status_name
      FROM applications a
      JOIN job_posts j ON a.job_id = j.id
      JOIN users u ON a.candidate_user_id = u.id
      LEFT JOIN candidate_profiles cp ON a.candidate_user_id = cp.user_id
      LEFT JOIN application_statuses aps ON a.status_id = aps.id
      WHERE a.id = ? AND a.deleted_at IS NULL
    `, [applicationId]);

    if (!applicationResult) {
      return res.status(404).json({ 
        message: 'Application not found',
        code: 'NOT_FOUND'
      });
    }

    // Check access permissions
    if (role === 'Candidate' && applicationResult.candidate_user_id !== userId) {
      return res.status(403).json({ 
        message: 'Access denied: You can only view your own applications',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get application answers
    const answersResult = await executeQuery<ApplicationAnswer>(`
      SELECT 
        aa.id,
        aa.application_id,
        aa.job_form_field_id,
        aa.answer_text,
        jff.input_type,
        jff.label
      FROM application_answers aa
      JOIN job_form_fields jff ON aa.job_form_field_id = jff.id
      WHERE aa.application_id = ?
      ORDER BY aa.id
    `, [applicationId]);

    // Fetch form fields used by this job
    const formFieldIds = applicationResult.form_field_id ? 
      JSON.parse(applicationResult.form_field_id) : [];
    
    let formFields: JobFormField[] = [];
    if (formFieldIds.length > 0) {
      const placeholders = formFieldIds.map(() => '?').join(',');
      formFields = await executeQuery<JobFormField>(`
        SELECT id, input_type, label FROM job_form_fields WHERE id IN (${placeholders})
      `, formFieldIds);
    }

    // Build response
    const application: Application = {
      id: applicationResult.id,
      job_id: applicationResult.job_id,
      candidate_user_id: applicationResult.candidate_user_id,
      source: applicationResult.source,
      created_at: applicationResult.created_at,
      updated_at: applicationResult.updated_at,
      job: {
        id: applicationResult.job_id,
        title: applicationResult.job_title,
        summary: applicationResult.job_summary,
        department_id: applicationResult.department_id,
        experience_level_id: applicationResult.experience_level_id,
        job_type_id: applicationResult.job_type_id,
        salary_min: applicationResult.salary_min,
        salary_max: applicationResult.salary_max,
        deadline: applicationResult.deadline
      },
      candidate: {
        id: applicationResult.candidate_user_id,
        email: applicationResult.candidate_email,
        full_name: applicationResult.candidate_name,
        phone: applicationResult.candidate_phone,
        linkedin_url: applicationResult.candidate_linkedin,
        portfolio_url: applicationResult.candidate_portfolio
      },
      status_id: applicationResult.status_id,
      status: {
        id: applicationResult.status_id,
        name: applicationResult.status_name
      },
      answers: answersResult,
      form_fields: formFields
    };

    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Submit new application (Candidate only)
export const handleSubmitApplication: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Only candidates can submit applications',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { job_id, source, answers } = req.body as SubmitApplicationRequest;

    if (!job_id || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ 
        message: 'Invalid request data: job_id and answers array required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if candidate profile exists
    const profile = await findOne<{ id: number }>(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (!profile) {
      return res.status(404).json({ 
        message: 'Candidate profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Check if job exists and is published
    const job = await findOne<{ id: number; status_id: number }>(`
      SELECT id, status_id 
      FROM job_posts 
      WHERE id = ? AND deleted_at IS NULL
    `, [job_id]);

    if (!job) {
      return res.status(404).json({ 
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    // Check if job is published (status_id = 2 for Published)
    if (job.status_id !== 2) {
      return res.status(400).json({ 
        message: 'Cannot apply to unpublished job',
        code: 'JOB_NOT_PUBLISHED'
      });
    }

    // Check for duplicate application
    const existingApp = await findOne<{ id: number }>(`
      SELECT id FROM applications 
      WHERE candidate_user_id = ? AND job_id = ?
    `, [userId, job_id]);

    if (existingApp) {
      return res.status(409).json({ 
        message: 'You have already applied for this job',
        code: 'DUPLICATE_APPLICATION'
      });
    }

    // Get default status (Applied = 1)
    const defaultStatus = await findOne<{ id: number }>(`
      SELECT id FROM application_statuses WHERE name = 'Applied' LIMIT 1
    `);
    const statusId = defaultStatus?.id || 1;

    // Create application in transaction
    const result = await transaction(async (connection) => {
      // Insert application
      const [appResult] = await connection.execute(`
        INSERT INTO applications (candidate_user_id, job_id, status_id, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [userId, job_id, statusId, source || 'Direct']);

      const applicationId = (appResult as any).insertId;

      // Insert answers
      if (answers.length > 0) {
        for (const answer of answers) {
          if (answer.job_form_field_id && answer.answer_text) {
            await connection.execute(`
              INSERT INTO application_answers (application_id, job_form_field_id, answer_text)
              VALUES (?, ?, ?)
            `, [applicationId, answer.job_form_field_id, answer.answer_text]);
          }
        }
      }

      return { applicationId, statusId };
    });

    // Fetch created application
    const newApplication = await findOne<any>(`
      SELECT 
        a.id,
        a.job_id,
        a.candidate_user_id,
        a.status_id,
        a.source,
        a.created_at,
        j.title as job_title,
        aps.name as status_name
      FROM applications a
      JOIN job_posts j ON a.job_id = j.id
      LEFT JOIN application_statuses aps ON a.status_id = aps.id
      WHERE a.id = ?
    `, [result.applicationId]);

    res.status(201).json({
      id: newApplication.id,
      job_id: newApplication.job_id,
      candidate_user_id: newApplication.candidate_user_id,
      source: newApplication.source,
      created_at: newApplication.created_at,
      status: {
        id: result.statusId,
        name: newApplication.status_name
      },
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ 
      message: 'Failed to submit application',
      code: 'SUBMIT_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update application status (HiringManager and SuperAdmin only)
export const handleUpdateApplicationStatus: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const applicationId = parseInt(req.params.id);

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'HiringManager' && role !== 'SuperAdmin') {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (isNaN(applicationId)) {
      return res.status(400).json({ 
        message: 'Invalid application ID',
        code: 'VALIDATION_ERROR'
      });
    }

    const { status_id, notes } = req.body as UpdateApplicationStatusRequest;

    if (!status_id) {
      return res.status(400).json({ 
        message: 'status_id is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Verify application exists
    const application = await findOne<{ id: number; status_id: number }>(`
      SELECT id, status_id 
      FROM applications 
      WHERE id = ? AND deleted_at IS NULL
    `, [applicationId]);

    if (!application) {
      return res.status(404).json({ 
        message: 'Application not found',
        code: 'NOT_FOUND'
      });
    }

    // Update status
    await executeQuery(`
      UPDATE applications 
      SET status_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status_id, applicationId]);

    // Get updated status name
    const newStatus = await findOne<{ name: string }>(`
      SELECT name FROM application_statuses WHERE id = ?
    `, [status_id]);

    res.json({
      id: applicationId,
      status_id,
      status_name: newStatus?.name,
      message: 'Application status updated successfully'
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ 
      message: 'Failed to update application status',
      code: 'UPDATE_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Withdraw application (Candidate only)
export const handleWithdrawApplication: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const applicationId = parseInt(req.params.applicationId);

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Only candidates can withdraw applications',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (isNaN(applicationId)) {
      return res.status(400).json({ 
        message: 'Invalid application ID',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if application belongs to candidate and get current status
    const application = await findOne<{ id: number; status_id: number }>(`
      SELECT id, status_id 
      FROM applications 
      WHERE id = ? AND candidate_user_id = ? AND deleted_at IS NULL
    `, [applicationId, userId]);

    if (!application) {
      return res.status(404).json({ 
        message: 'Application not found or access denied',
        code: 'NOT_FOUND'
      });
    }

    // Get Withdrawn status ID (6 based on your data)
    const withdrawnStatus = await findOne<{ id: number }>(`
      SELECT id FROM application_statuses WHERE name = 'Withdrawn' LIMIT 1
    `);
    
    if (!withdrawnStatus) {
      return res.status(500).json({ 
        message: 'Withdrawn status not configured',
        code: 'CONFIG_ERROR'
      });
    }

    // Update status
    await executeQuery(`
      UPDATE applications 
      SET status_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [withdrawnStatus.id, applicationId]);

    res.json({
      message: 'Application withdrawn successfully',
      application_id: applicationId
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ 
      message: 'Failed to withdraw application',
      code: 'WITHDRAW_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get application statistics (HiringManager and SuperAdmin only)
export const handleGetApplicationStats: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'HiringManager' && role !== 'SuperAdmin') {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get statistics by status
    const statsResult = await executeQuery<any>(`
      SELECT 
        aps.id,
        aps.name,
        COUNT(a.id) as count
      FROM application_statuses aps
      LEFT JOIN applications a ON aps.id = a.status_id AND a.deleted_at IS NULL
      GROUP BY aps.id, aps.name
      ORDER BY aps.id
    `);

    // Format as object for easier frontend consumption
    const stats: Record<string, number> = {};
    let total = 0;
    
    statsResult.forEach((stat: any) => {
      stats[stat.name.toLowerCase().replace(/\s+/g, '_')] = stat.count;
      total += stat.count;
    });

    res.json({
      total,
      by_status: stats
    });
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch statistics',
      code: 'STATS_FAILED',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};