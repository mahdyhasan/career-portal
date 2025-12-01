// server/routes/applications.ts
import { RequestHandler } from "express";
import { executeQuery, executeSingleQuery } from "../config/database";
import { AuthRequest } from "../middleware/auth";

// Get applications (for candidates and admins)
export const handleGetApplications: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    let whereClause = "";
    let queryParams: any[] = [];

    // Handle candidate_user_id filter for admins
    const candidateUserId = req.query.candidate_user_id ? parseInt(req.query.candidate_user_id as string) : null;

    if (role === 'Candidate') {
      // Candidates can only see their own applications
      whereClause = "WHERE cp.user_id = ?";
      queryParams = [userId];
    } else if (role === 'HiringManager' || role === 'SuperAdmin') {
      // Admins can see all applications, or filter by candidate_user_id if provided
      if (candidateUserId) {
        whereClause = "WHERE cp.user_id = ?";
        queryParams = [candidateUserId];
      } else {
        whereClause = "";
        queryParams = [];
      }
    } else {
      return res.status(403).json({ 
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get total count
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total
      FROM applications a
      JOIN candidate_profiles cp ON a.candidate_user_id = cp.user_id
      ${whereClause}
    `, queryParams);

    // Add pagination parameters for the main query
    const paginationParams = [...queryParams, limit, offset];

    // Get applications with pagination
    const applicationsResult = await executeQuery(`
      SELECT 
        a.id,
        a.job_id,
        a.candidate_user_id,
        a.status_id,
        a.created_at,
        a.updated_at,
        j.title as job_title,
        j.location_text as job_location,
        comp.name as company_name,
        cp.first_name,
        cp.last_name,
        s.name as status_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies comp ON j.company_id = comp.id
      JOIN candidate_profiles cp ON a.candidate_user_id = cp.user_id
      LEFT JOIN application_statuses s ON a.status_id = s.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, paginationParams);

    // Process applications (without history for now since table doesn't exist)
    const applications = applicationsResult.map((app: any) => ({
      id: app.id,
      job: {
        id: app.job_id,
        title: app.job_title,
        location_text: app.job_location
      },
      candidate: {
        id: app.candidate_user_id,
        first_name: app.first_name,
        last_name: app.last_name
      },
      status: {
        id: app.status_id,
        name: app.status_name
      },
      created_at: app.created_at,
      updated_at: app.updated_at,
      history: [] // Empty array for now since table doesn't exist
    }));

    const total = countResult[0]?.total || 0;

    res.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get application by ID
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
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    // Get application with details
    const applicationResult = await executeQuery(`
      SELECT 
        a.id,
        a.job_id,
        a.candidate_user_id,
        a.status_id,
        a.created_at,
        a.updated_at,
        j.title as job_title,
        j.description as job_description,
        j.location_text as job_location,
        comp.name as company_name,
        cp.first_name,
        cp.last_name,
        u.email,
        s.name as status_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies comp ON j.company_id = comp.id
      JOIN candidate_profiles cp ON a.candidate_user_id = cp.user_id
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN application_statuses s ON a.status_id = s.id
      WHERE a.id = ?
    `, [applicationId]);

    if (applicationResult.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const application = applicationResult[0];

    // Check access permissions
    if (role === 'Candidate') {
      // Candidates can only see their own applications
      if (application.candidate_user_id !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Get application answers
    const answersResult = await executeQuery(`
      SELECT 
        aa.id,
        aa.job_form_field_id,
        aa.answer_text,
        jff.label as field_label,
        it.name as field_type
      FROM application_answers aa
      JOIN job_form_fields jff ON aa.job_form_field_id = jff.id
      JOIN input_types it ON jff.input_type_id = it.id
      WHERE aa.application_id = ?
      ORDER BY jff.sort_order
    `, [applicationId]);

    // Get application history (disabled for now since table doesn't exist)
    const historyResult: any[] = [];

    const applicationData = {
      id: application.id,
      job: {
        id: application.job_id,
        title: application.job_title,
        description: application.job_description,
        location_text: application.job_location,
        company: {
          name: application.company_name
        }
      },
      candidate: {
        id: application.candidate_user_id,
        first_name: application.first_name,
        last_name: application.last_name,
        email: application.email
      },
      status: {
        id: application.status_id,
        name: application.status_name
      },
      answers: answersResult,
      history: historyResult,
      created_at: application.created_at,
      updated_at: application.updated_at
    };

    res.json(applicationData);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Submit application
export const handleSubmitApplication: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const { job_id, answers } = req.body;

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (!job_id || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    // Check if candidate profile exists
    const candidateResult = await executeQuery(`
      SELECT user_id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }

    // Check if already applied
    const existingApplication = await executeQuery(`
      SELECT id FROM applications WHERE candidate_user_id = ? AND job_id = ?
    `, [userId, job_id]);

    if (existingApplication.length > 0) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }

    // Get default application status
    const statusResult = await executeQuery(`
      SELECT id FROM application_statuses WHERE name = 'Applied' LIMIT 1
    `);

    const statusId = statusResult.length > 0 ? statusResult[0].id : 1;

    // Create application
    const applicationInsertResult = await executeSingleQuery(`
      INSERT INTO applications (candidate_user_id, job_id, status_id, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [userId, job_id, statusId]);

    const applicationId = applicationInsertResult.insertId;

    // Insert application answers
    for (const answer of answers) {
      if (answer.job_form_field_id && answer.answer_text) {
        await executeQuery(`
          INSERT INTO application_answers (application_id, job_form_field_id, answer_text)
          VALUES (?, ?, ?)
        `, [applicationId, answer.job_form_field_id, answer.answer_text]);
      }
    }

    // Get complete application data
    const completeApplicationResult = await executeQuery(`
      SELECT 
        a.id,
        a.job_id,
        a.candidate_user_id,
        a.status_id,
        a.created_at,
        j.title as job_title,
        comp.name as company_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies comp ON j.company_id = comp.id
      WHERE a.id = ?
    `, [applicationId]);

    const application = completeApplicationResult[0];

    res.status(201).json({
      id: application.id,
      job: {
        id: application.job_id,
        title: application.job_title,
        company: {
          name: application.company_name
        }
      },
      candidate: {
        id: application.candidate_user_id
      },
      status: {
        id: statusId,
        name: 'Applied'
      },
      created_at: application.created_at
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Update application status (HiringManager/SuperAdmin only)
export const handleUpdateApplicationStatus: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const applicationId = parseInt(req.params.id);
    const { status_id, notes } = req.body;

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'HiringManager' && role !== 'SuperAdmin') {
      return res.status(403).json({ 
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (!status_id) {
      return res.status(400).json({ message: 'Status ID is required' });
    }

    // Get current application to check if it exists
    const applicationResult = await executeQuery(`
      SELECT id, status_id FROM applications WHERE id = ?
    `, [applicationId]);

    if (applicationResult.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const previousStatusId = applicationResult[0].status_id;

    // Update application status
    await executeQuery(`
      UPDATE applications 
      SET status_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status_id, applicationId]);

    // History tracking disabled for now since table doesn't exist
    // TODO: Create application_history table to enable status tracking

    // Get updated application
    const updatedApplicationResult = await executeQuery(`
      SELECT 
        a.id,
        a.job_id,
        a.candidate_user_id,
        a.status_id,
        a.updated_at,
        j.title as job_title,
        s.name as status_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN application_statuses s ON a.status_id = s.id
      WHERE a.id = ?
    `, [applicationId]);

    res.json(updatedApplicationResult[0]);
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Get application statistics
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
        message: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get application statistics by status
    const statsResult = await executeQuery(`
      SELECT 
        s.name as status,
        COUNT(a.id) as count
      FROM application_statuses s
      LEFT JOIN applications a ON s.id = a.status_id
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    const stats: Record<string, number> = {};
    statsResult.forEach((stat: any) => {
      stats[stat.status.toLowerCase()] = stat.count;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
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
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (isNaN(applicationId)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    // Check if application belongs to candidate
    const applicationResult = await executeQuery(`
      SELECT id, status_id FROM applications WHERE id = ? AND candidate_user_id = ?
    `, [applicationId, userId]);

    if (applicationResult.length === 0) {
      return res.status(404).json({ message: 'Application not found or access denied' });
    }

    const previousStatusId = applicationResult[0].status_id;

    // Get 'Withdrawn' status ID
    const withdrawnStatusResult = await executeQuery(`
      SELECT id FROM application_statuses WHERE name = 'Withdrawn' LIMIT 1
    `);

    let withdrawnStatusId;
    if (withdrawnStatusResult.length === 0) {
      // Create withdrawn status if it doesn't exist
      const newStatus = await executeSingleQuery(`
        INSERT INTO application_statuses (name) VALUES ('Withdrawn')
      `);
      withdrawnStatusId = newStatus.insertId;
    } else {
      withdrawnStatusId = withdrawnStatusResult[0].id;
    }

    // Update application status
    await executeQuery(`
      UPDATE applications 
      SET status_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [withdrawnStatusId, applicationId]);

    // History tracking disabled for now since table doesn't exist
    // TODO: Create application_history table to enable status tracking

    res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
