// server/routes/applications.ts
import { RequestHandler } from 'express';
import { executeQuery, executeSingleQuery, findOne, transaction } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { Application, SubmitApplicationRequest, UpdateApplicationStatusRequest } from '@shared/api';

// Get applications with filters
export const handleGetApplications: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const statusId = req.query.status_id ? parseInt(req.query.status_id as string) : null;
    const jobId = req.query.job_id ? parseInt(req.query.job_id as string) : null;
    const search = req.query.search as string;

    let query = `
      SELECT 
        a.id,
        a.job_id,
        a.candidate_user_id,
        a.status_id,
        a.source,
        a.created_at,
        a.updated_at,
        j.title as job_title,
        j.department_id,
        d.name as department_name,
        s.name as status_name,
        u.email as candidate_email,
        c.full_name as candidate_name,
        c.phone as candidate_phone
      FROM applications a
      LEFT JOIN job_posts j ON a.job_id = j.id
      LEFT JOIN system_departments d ON j.department_id = d.id
      LEFT JOIN application_statuses s ON a.status_id = s.id
      LEFT JOIN users u ON a.candidate_user_id = u.id
      LEFT JOIN candidate_profiles c ON a.candidate_user_id = c.user_id
      WHERE a.deleted_at IS NULL
    `;

    const params: any[] = [];

    // Role-based filtering
    if (user.role?.name === 'Candidate') {
      query += ' AND a.candidate_user_id = ?';
      params.push(user.id);
    } else if (user.role?.name === 'HiringManager') {
      // Hiring managers can see applications for their jobs
      query += ' AND j.created_by = ?';
      params.push(user.id);
    }
    // SuperAdmin can see all applications

    if (statusId) {
      query += ' AND a.status_id = ?';
      params.push(statusId);
    }

    if (jobId) {
      query += ' AND a.job_id = ?';
      params.push(jobId);
    }

    if (search) {
      query += ' AND (j.title LIKE ? OR c.full_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const applications = await executeQuery<any>(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM applications a
      LEFT JOIN job_posts j ON a.job_id = j.id
      LEFT JOIN users u ON a.candidate_user_id = u.id
      LEFT JOIN candidate_profiles c ON a.candidate_user_id = c.user_id
      WHERE a.deleted_at IS NULL
    `;
    
    const countParams: any[] = [];

    if (user.role?.name === 'Candidate') {
      countQuery += ' AND a.candidate_user_id = ?';
      countParams.push(user.id);
    } else if (user.role?.name === 'HiringManager') {
      countQuery += ' AND j.created_by = ?';
      countParams.push(user.id);
    }

    if (statusId) {
      countQuery += ' AND a.status_id = ?';
      countParams.push(statusId);
    }

    if (jobId) {
      countQuery += ' AND a.job_id = ?';
      countParams.push(jobId);
    }

    if (search) {
      countQuery += ' AND (j.title LIKE ? OR c.full_name LIKE ? OR u.email LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const totalResult = await findOne<{ total: number }>(countQuery, countParams);

    // Transform to Application type
    const transformedApplications: Application[] = applications.map(app => ({
      id: app.id,
      job_id: app.job_id,
      candidate_user_id: app.candidate_user_id,
      status_id: app.status_id,
      source: app.source,
      created_at: app.created_at,
      updated_at: app.updated_at,
      job: {
        id: app.job_id,
        title: app.job_title,
        department_id: app.department_id,
        experience_level_id: 0, // Default value, should be joined from database
        job_type_id: 0, // Default value, should be joined from database
        status_id: 0, // Default value, should be joined from database
        summary: '', // Default value, should be joined from database
        created_at: app.created_at,
        updated_at: app.updated_at,
        department: {
          id: app.department_id,
          name: app.department_name
        }
      },
      candidate: {
        id: app.candidate_user_id,
        email: app.candidate_email,
        full_name: app.candidate_name,
        phone: app.candidate_phone,
        role_id: 0, // Default value, should be joined from database
        is_active: true, // Default value, should be joined from database
        created_at: app.created_at,
        updated_at: app.updated_at
      },
      status: {
        id: app.status_id,
        name: app.status_name
      }
    }));

    res.json({
      data: transformedApplications,
      total: totalResult?.total || 0,
      page,
      limit,
      totalPages: Math.ceil((totalResult?.total || 0) / limit)
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      message: 'Failed to fetch applications',
      code: 'FETCH_APPLICATIONS_FAILED'
    });
  }
};

// Get single application by ID
export const handleGetApplication: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const applicationId = parseInt(req.params.id);
    
    if (!applicationId) {
      return res.status(400).json({
        message: 'Application ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const application = await findOne<any>(`
      SELECT 
        a.id,
        a.job_id,
        a.candidate_user_id,
        a.status_id,
        a.source,
        a.created_at,
        a.updated_at,
        j.title as job_title,
        j.department_id,
        d.name as department_name,
        s.name as status_name,
        u.email as candidate_email,
        c.full_name as candidate_name,
        c.phone as candidate_phone,
        c.linkedin_url,
        c.github_url,
        c.portfolio_url
      FROM applications a
      LEFT JOIN job_posts j ON a.job_id = j.id
      LEFT JOIN system_departments d ON j.department_id = d.id
      LEFT JOIN application_statuses s ON a.status_id = s.id
      LEFT JOIN users u ON a.candidate_user_id = u.id
      LEFT JOIN candidate_profiles c ON a.candidate_user_id = c.user_id
      WHERE a.id = ? AND a.deleted_at IS NULL
    `, [applicationId]);

    if (!application) {
      return res.status(404).json({
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND'
      });
    }

    // Check permissions
    if (user.role?.name === 'Candidate' && application.candidate_user_id !== user.id) {
      return res.status(403).json({
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (user.role?.name === 'HiringManager') {
      const jobCreator = await findOne<any>(`
        SELECT created_by FROM job_posts WHERE id = ?
      `, [application.job_id]);
      
      if (jobCreator?.created_by !== user.id) {
        return res.status(403).json({
          message: 'Access denied',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }

    // Get application answers
    const answers = await executeQuery<any>(`
      SELECT 
        aa.id,
        aa.job_form_field_id,
        aa.answer_text,
        jff.input_type,
        jff.label
      FROM application_answers aa
      LEFT JOIN job_form_fields jff ON aa.job_form_field_id = jff.id
      WHERE aa.application_id = ?
    `, [applicationId]);

    // Get candidate skills
    const skills = await executeQuery<any>(`
      SELECT 
        s.name,
        cs.proficiency,
        cs.years_experience
      FROM candidate_skills cs
      LEFT JOIN system_skills s ON cs.skill_id = s.id
      WHERE cs.candidate_profile_id = (
        SELECT id FROM candidate_profiles WHERE user_id = ?
      )
    `, [application.candidate_user_id]);

    // Get candidate education
    const education = await executeQuery<any>(`
      SELECT *
      FROM candidate_educations
      WHERE candidate_profile_id = (
        SELECT id FROM candidate_profiles WHERE user_id = ?
      )
      ORDER BY graduation_year DESC
    `, [application.candidate_user_id]);

    // Get candidate attachments
    const attachments = await executeQuery<any>(`
      SELECT 
        id,
        file_type,
        file_url,
        uploaded_at
      FROM candidate_attachments
      WHERE candidate_profile_id = (
        SELECT id FROM candidate_profiles WHERE user_id = ?
      )
    `, [application.candidate_user_id]);

    const transformedApplication: Application = {
      id: application.id,
      job_id: application.job_id,
      candidate_user_id: application.candidate_user_id,
      status_id: application.status_id,
      source: application.source,
      created_at: application.created_at,
      updated_at: application.updated_at,
      job: {
        id: application.job_id,
        title: application.job_title,
        department_id: application.department_id,
        experience_level_id: 0, // Default value, should be joined from database
        job_type_id: 0, // Default value, should be joined from database
        status_id: 0, // Default value, should be joined from database
        summary: '', // Default value, should be joined from database
        created_at: application.created_at,
        updated_at: application.updated_at,
        department: {
          id: application.department_id,
          name: application.department_name
        }
      },
      candidate: {
        id: application.candidate_user_id,
        email: application.candidate_email,
        full_name: application.candidate_name,
        phone: application.candidate_phone,
        role_id: 0, // Default value, should be joined from database
        is_active: true, // Default value, should be joined from database
        created_at: application.created_at,
        updated_at: application.updated_at
      },
      status: {
        id: application.status_id,
        name: application.status_name
      },
      answers: answers.map(answer => ({
        id: answer.id,
        application_id: applicationId,
        job_form_field_id: answer.job_form_field_id,
        answer_text: answer.answer_text,
        form_field: {
          id: answer.job_form_field_id,
          input_type: answer.input_type,
          label: answer.label
        }
      })),
      candidate_profile: {
        skills: skills.map(skill => ({
          skill: skill.name,
          proficiency: skill.proficiency,
          years_experience: skill.years_experience
        })),
        education: education.map(edu => ({
          id: edu.id,
          institute_name: edu.institute_name,
          degree: edu.degree,
          major_subject: edu.major_subject,
          graduation_year: edu.graduation_year,
          result: edu.result
        })),
        attachments: attachments.map(attachment => ({
          id: attachment.id,
          file_type: attachment.file_type,
          file_url: attachment.file_url,
          uploaded_at: attachment.uploaded_at
        }))
      }
    };

    res.json(transformedApplication);

  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      message: 'Failed to fetch application',
      code: 'FETCH_APPLICATION_FAILED'
    });
  }
};

// Submit application
export const handleSubmitApplication: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user || user.role?.name !== 'Candidate') {
      return res.status(403).json({
        message: 'Only candidates can submit applications',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const applicationData: SubmitApplicationRequest = req.body;

    if (!applicationData.job_id) {
      return res.status(400).json({
        message: 'Job ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if job exists and is published
    const job = await findOne<any>(`
      SELECT j.*, js.name as status_name
      FROM job_posts j
      LEFT JOIN job_statuses js ON j.status_id = js.id
      WHERE j.id = ? AND j.deleted_at IS NULL
    `, [applicationData.job_id]);

    if (!job) {
      return res.status(404).json({
        message: 'Job not found',
        code: 'JOB_NOT_FOUND'
      });
    }

    if (job.status_name !== 'Published') {
      return res.status(400).json({
        message: 'Job is not accepting applications',
        code: 'JOB_NOT_ACCEPTING'
      });
    }

    // Check if candidate has already applied
    const existingApplication = await findOne<any>(`
      SELECT id FROM applications 
      WHERE job_id = ? AND candidate_user_id = ? AND deleted_at IS NULL
    `, [applicationData.job_id, user.id]);

    if (existingApplication) {
      return res.status(400).json({
        message: 'You have already applied for this job',
        code: 'ALREADY_APPLIED'
      });
    }

    // Get default status (Applied)
    const statusResult = await findOne<{ id: number }>(`
      SELECT id FROM application_statuses WHERE name = 'Applied' LIMIT 1
    `);
    const defaultStatusId = statusResult?.id || 1;

    // Start transaction
    const result = await transaction(async (connection) => {
      // Create application
      const applicationResult = await connection.execute(`
        INSERT INTO applications (
          job_id, candidate_user_id, status_id, source, created_at, updated_at
        ) VALUES (?, ?, ?, ?, NOW(), NOW())
      `, [
        applicationData.job_id,
        user.id,
        defaultStatusId,
        applicationData.source || 'Direct'
      ]);

      const applicationId = (applicationResult as any)[0].insertId;

      // Save application answers if provided
      if (applicationData.answers && applicationData.answers.length > 0) {
        for (const answer of applicationData.answers) {
          await connection.execute(`
            INSERT INTO application_answers (
              application_id, job_form_field_id, answer_text
            ) VALUES (?, ?, ?)
          `, [applicationId, answer.job_form_field_id, answer.answer_text]);
        }
      }

      return { applicationId };
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: result.applicationId
    });

  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to submit application',
      code: 'SUBMISSION_FAILED'
    });
  }
};

// Update application status
export const handleUpdateApplicationStatus: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const applicationId = parseInt(req.params.id);
    const { status_id, notes }: UpdateApplicationStatusRequest = req.body;

    if (!applicationId || !status_id) {
      return res.status(400).json({
        message: 'Application ID and status ID are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check permissions and get application
    const application = await findOne<any>(`
      SELECT a.*, j.created_by as job_creator_id
      FROM applications a
      LEFT JOIN job_posts j ON a.job_id = j.id
      WHERE a.id = ? AND a.deleted_at IS NULL
    `, [applicationId]);

    if (!application) {
      return res.status(404).json({
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND'
      });
    }

    // Check permissions
    if (user.role?.name === 'Candidate' && application.candidate_user_id !== user.id) {
      return res.status(403).json({
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (user.role?.name === 'HiringManager' && application.job_creator_id !== user.id) {
      return res.status(403).json({
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Update application status
    await executeSingleQuery(`
      UPDATE applications 
      SET status_id = ?, updated_at = NOW()
      WHERE id = ?
    `, [status_id, applicationId]);

    // Log status change (optional - could add to audit log)
    console.log(`Application ${applicationId} status changed to ${status_id} by user ${user.id}`);

    res.json({
      message: 'Application status updated successfully'
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to update application status',
      code: 'STATUS_UPDATE_FAILED'
    });
  }
};

// Get application statistics
export const handleGetApplicationStats: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    let baseQuery = `
      SELECT 
        s.name as status_name,
        s.id as status_id,
        COUNT(a.id) as count
      FROM application_statuses s
      LEFT JOIN applications a ON s.id = a.status_id AND a.deleted_at IS NULL
    `;

    const params: any[] = [];

    // Role-based filtering
    if (user.role?.name === 'Candidate') {
      baseQuery += ' WHERE a.candidate_user_id = ?';
      params.push(user.id);
    } else if (user.role?.name === 'HiringManager') {
      baseQuery += ' WHERE a.job_id IN (SELECT id FROM job_posts WHERE created_by = ?)';
      params.push(user.id);
    }

    baseQuery += ' GROUP BY s.id, s.name ORDER BY s.id';

    const stats = await executeQuery<any>(baseQuery, params);

    // Get recent applications
    let recentQuery = `
      SELECT 
        a.id,
        a.created_at,
        j.title as job_title,
        c.full_name as candidate_name,
        s.name as status_name
      FROM applications a
      LEFT JOIN job_posts j ON a.job_id = j.id
      LEFT JOIN candidate_profiles c ON a.candidate_user_id = c.user_id
      LEFT JOIN application_statuses s ON a.status_id = s.id
      WHERE a.deleted_at IS NULL
    `;

    const recentParams: any[] = [];

    if (user.role?.name === 'Candidate') {
      recentQuery += ' AND a.candidate_user_id = ?';
      recentParams.push(user.id);
    } else if (user.role?.name === 'HiringManager') {
      recentQuery += ' AND j.created_by = ?';
      recentParams.push(user.id);
    }

    recentQuery += ' ORDER BY a.created_at DESC LIMIT 5';

    const recentApplications = await executeQuery<any>(recentQuery, recentParams);

    res.json({
      statusCounts: stats.map(stat => ({
        status: stat.status_name,
        statusId: stat.status_id,
        count: stat.count
      })),
      recentApplications: recentApplications.map(app => ({
        id: app.id,
        jobTitle: app.job_title,
        candidateName: app.candidate_name,
        status: app.status_name,
        appliedAt: app.created_at
      }))
    });

  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      message: 'Failed to fetch application statistics',
      code: 'STATS_FETCH_FAILED'
    });
  }
};

// Withdraw application
export const handleWithdrawApplication: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user || user.role?.name !== 'Candidate') {
      return res.status(403).json({
        message: 'Only candidates can withdraw applications',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const applicationId = parseInt(req.params.applicationId);

    if (!applicationId) {
      return res.status(400).json({
        message: 'Application ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if application exists and belongs to user
    const application = await findOne<any>(`
      SELECT a.*, s.name as status_name
      FROM applications a
      LEFT JOIN application_statuses s ON a.status_id = s.id
      WHERE a.id = ? AND a.deleted_at IS NULL
    `, [applicationId]);

    if (!application) {
      return res.status(404).json({
        message: 'Application not found',
        code: 'APPLICATION_NOT_FOUND'
      });
    }

    if (application.candidate_user_id !== user.id) {
      return res.status(403).json({
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Can't withdraw if already in final stages
    const finalStatuses = ['Offer', 'Hired', 'Rejected'];
    if (finalStatuses.includes(application.status_name)) {
      return res.status(400).json({
        message: 'Cannot withdraw application in current status',
        code: 'WITHDRAWAL_NOT_ALLOWED'
      });
    }

    // Get withdrawn status ID
    const withdrawnStatus = await findOne<{ id: number }>(`
      SELECT id FROM application_statuses WHERE name = 'Withdrawn' LIMIT 1
    `);

    if (!withdrawnStatus) {
      return res.status(500).json({
        message: 'Withdrawn status not found',
        code: 'STATUS_NOT_FOUND'
      });
    }

    // Update application status to withdrawn
    await executeSingleQuery(`
      UPDATE applications 
      SET status_id = ?, updated_at = NOW()
      WHERE id = ?
    `, [withdrawnStatus.id, applicationId]);

    res.json({
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to withdraw application',
      code: 'WITHDRAWAL_FAILED'
    });
  }
};
