import { RequestHandler } from "express";
import { executeQuery, executeSingleQuery } from "../config/database";
import { AuthRequest } from "../middleware/auth";
import { 
  successResponse, 
  errorResponse, 
  authErrorResponse, 
  authorizationErrorResponse,
  notFoundResponse,
  HTTP_STATUS,
  ERROR_CODES,
  ERROR_MESSAGES
} from "../utils/apiResponses";

// Get all users (SuperAdmin only)
export const handleGetUsers: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';

    if (!userId || !role) {
      return authErrorResponse(res, ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED]);
    }

    if (role !== 'SuperAdmin') {
      return authorizationErrorResponse(
        res,
        ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_PERMISSIONS],
        ['SuperAdmin']
      );
    }

    // Build WHERE clause for search
    let whereClause = "WHERE u.deleted_at IS NULL";
    let queryParams: any[] = [];

    if (search) {
      whereClause += " AND (u.email LIKE ?)";
      queryParams = [`%${search}%`];
    }

    // Get total count
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `, queryParams);

    // Get users with pagination
    const usersResult = await executeQuery(`
      SELECT 
        u.id,
        u.email,
        u.is_active,
        u.created_at,
        u.updated_at,
        r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    const total = countResult[0]?.total || 0;

    return successResponse(res, HTTP_STATUS.OK, 'Users retrieved successfully', {
      users: usersResult,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR], error);
  }
};

// Create new user (SuperAdmin only)
export const handleCreateUser: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      role_name, 
      phone 
    } = req.body;

    if (!userId || !role) {
      return authErrorResponse(res, ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED]);
    }

    if (role !== 'SuperAdmin') {
      return authorizationErrorResponse(
        res,
        ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_PERMISSIONS],
        ['SuperAdmin']
      );
    }

    // Validate required fields
    if (!email || !password || !role_name) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
        {
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined,
          role_name: !role_name ? 'Role is required' : undefined
        }
      );
    }

    // Validate role
    if (!['SuperAdmin', 'HiringManager', 'Candidate'].includes(role_name)) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
        { role_name: 'Invalid role. Must be SuperAdmin, HiringManager, or Candidate' }
      );
    }

    // Check if user already exists
    const existingUser = await executeQuery(`
      SELECT id FROM users WHERE email = ? AND deleted_at IS NULL
    `, [email]);

    if (existingUser.length > 0) {
      return errorResponse(
        res,
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES[ERROR_CODES.DUPLICATE_RESOURCE],
        { email: 'User with this email already exists' }
      );
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get role ID
    const roleResult = await executeQuery(`
      SELECT id FROM roles WHERE name = ?
    `, [role_name]);

    if (roleResult.length === 0) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES[ERROR_CODES.NOT_FOUND],
        { role_name: 'Invalid role' }
      );
    }

    const roleId = roleResult[0].id;

    // Create user
    const result = await executeSingleQuery(`
      INSERT INTO users (email, password_hash, role_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [email, hashedPassword, roleId]);

    const newUserId = result.insertId;

    // Get created user
    const userResult = await executeQuery(`
      SELECT 
        u.id,
        u.email,
        u.is_active,
        u.created_at,
        u.updated_at,
        r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
    WHERE u.id = ?
    `, [newUserId]);

    const user = userResult[0];

    // Create candidate profile if role is Candidate
    if (role_name === 'Candidate') {
      await executeQuery(`
        INSERT INTO candidate_profiles (user_id, created_at, updated_at)
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [newUserId]);
    }

    return successResponse(res, HTTP_STATUS.CREATED, 'User created successfully', user);
  } catch (error) {
    console.error('Error creating user:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR], error);
  }
};

// Update user (SuperAdmin only)
export const handleUpdateUser: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const userIdToUpdate = parseInt(req.params.id);
    const { 
      email, 
      first_name, 
      last_name, 
      phone, 
      is_active 
    } = req.body;

    if (!userId || !role) {
      return authErrorResponse(res, ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED]);
    }

    if (role !== 'SuperAdmin') {
      return authorizationErrorResponse(
        res,
        ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_PERMISSIONS],
        ['SuperAdmin']
      );
    }

    if (isNaN(userIdToUpdate)) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
        { id: 'Invalid user ID' }
      );
    }

    // Check if user exists
    const userExists = await executeQuery(`
      SELECT id FROM users WHERE id = ? AND deleted_at IS NULL
    `, [userIdToUpdate]);

    if (userExists.length === 0) {
      return notFoundResponse(res, 'User not found', 'User');
    }

    // Check if email is being updated and if it already exists
    if (email && email !== userExists[0].email) {
      const emailExists = await executeQuery(`
        SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL
      `, [email, userIdToUpdate]);

      if (emailExists.length > 0) {
        return errorResponse(
          res,
          HTTP_STATUS.CONFLICT,
          ERROR_MESSAGES[ERROR_CODES.DUPLICATE_RESOURCE],
          { email: 'User with this email already exists' }
        );
      }
    }

    // Update user (only email and is_active are supported in new schema)
    const updateFields = [];
    const updateValues = [];

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    await executeQuery(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, [...updateValues, userIdToUpdate]);

    // Get updated user
    const userResult = await executeQuery(`
      SELECT 
        u.id,
        u.email,
        u.is_active,
        u.created_at,
        u.updated_at,
        r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [userIdToUpdate]);

    const user = userResult[0];

    return successResponse(res, HTTP_STATUS.OK, 'User updated successfully', user);
  } catch (error) {
    console.error('Error updating user:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR], error);
  }
};

// Update user status (SuperAdmin only)
export const handleUpdateUserStatus: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const userIdToUpdate = parseInt(req.params.id);
    const { is_active } = req.body;

    if (!userId || !role) {
      return authErrorResponse(res, ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED]);
    }

    if (role !== 'SuperAdmin') {
      return authorizationErrorResponse(
        res,
        ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_PERMISSIONS],
        ['SuperAdmin']
      );
    }

    if (isNaN(userIdToUpdate)) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
        { id: 'Invalid user ID' }
      );
    }

    // Check if user exists
    const userExists = await executeQuery(`
      SELECT id FROM users WHERE id = ? AND deleted_at IS NULL
    `, [userIdToUpdate]);

    if (userExists.length === 0) {
      return notFoundResponse(res, 'User not found', 'User');
    }

    // Update user status
    await executeQuery(`
      UPDATE users 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [is_active, userIdToUpdate]);

    return successResponse(res, HTTP_STATUS.OK, 'User status updated successfully');
  } catch (error) {
    console.error('Error updating user status:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR], error);
  }
};

// Update user role (SuperAdmin only)
export const handleUpdateUserRole: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const userIdToUpdate = parseInt(req.params.id);
    const { role_name } = req.body;

    if (!userId || !role) {
      return authErrorResponse(res, ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED]);
    }

    if (role !== 'SuperAdmin') {
      return authorizationErrorResponse(
        res,
        ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_PERMISSIONS],
        ['SuperAdmin']
      );
    }

    if (isNaN(userIdToUpdate)) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
        { id: 'Invalid user ID' }
      );
    }

    // Check if user exists
    const userExists = await executeQuery(`
      SELECT id FROM users WHERE id = ? AND deleted_at IS NULL
    `, [userIdToUpdate]);

    if (userExists.length === 0) {
      return notFoundResponse(res, 'User not found', 'User');
    }

    // Validate role
    if (!role_name || !['SuperAdmin', 'HiringManager', 'Candidate'].includes(role_name)) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
        { role_name: 'Invalid role. Must be SuperAdmin, HiringManager, or Candidate' }
      );
    }

    // Get role ID
    const roleResult = await executeQuery(`
      SELECT id FROM roles WHERE name = ?
    `, [role_name]);

    if (roleResult.length === 0) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES[ERROR_CODES.NOT_FOUND],
        { role_name: 'Invalid role' }
      );
    }

    const roleId = roleResult[0].id;

    // Update user role
    await executeQuery(`
      UPDATE users 
      SET role_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [roleId, userIdToUpdate]);

    // Get updated user
    const userResult = await executeQuery(`
      SELECT 
        u.id,
        u.email,
        u.is_active,
        u.created_at,
        u.updated_at,
        r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [userIdToUpdate]);

    const user = userResult[0];

    return successResponse(res, HTTP_STATUS.OK, 'User role updated successfully', user);
  } catch (error) {
    console.error('Error updating user role:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR], error);
  }
};

// Delete user (SuperAdmin only)
export const handleDeleteUser: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const userIdToDelete = parseInt(req.params.id);

    if (!userId || !role) {
      return authErrorResponse(res, ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED]);
    }

    if (role !== 'SuperAdmin') {
      return authorizationErrorResponse(
        res,
        ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_PERMISSIONS],
        ['SuperAdmin']
      );
    }

    if (isNaN(userIdToDelete)) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
        { id: 'Invalid user ID' }
      );
    }

    // Check if user exists
    const userExists = await executeQuery(`
      SELECT id FROM users WHERE id = ? AND deleted_at IS NULL
    `, [userIdToDelete]);

    if (userExists.length === 0) {
      return notFoundResponse(res, 'User not found', 'User');
    }

    // Soft delete user (set deleted_at)
    await executeQuery(`
      UPDATE users 
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [userIdToDelete]);

    return successResponse(res, HTTP_STATUS.OK, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR], error);
  }
};

// Get system statistics (SuperAdmin only)
export const handleGetSystemStats: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;

    if (!userId || !role) {
      return authErrorResponse(res, ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED]);
    }

    if (role !== 'SuperAdmin') {
      return authorizationErrorResponse(
        res,
        ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_PERMISSIONS],
        ['SuperAdmin']
      );
    }

    // Get user statistics
    const userStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users
      FROM users
      WHERE deleted_at IS NULL
    `);

    // Get job statistics
    const jobStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status_id = 2 THEN 1 END) as active_jobs
      FROM job_posts
      WHERE deleted_at IS NULL
    `);

    // Get application statistics
    const applicationStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status_id = 1 THEN 1 END) as pending_applications,
        COUNT(CASE WHEN status_id = 2 THEN 1 END) as shortlisted_applications,
        COUNT(CASE WHEN status_id = 3 THEN 1 END) as interview_applications,
        COUNT(CASE WHEN status_id = 4 THEN 1 END) as hired_applications
      FROM applications
      WHERE deleted_at IS NULL
    `);

    const stats = {
      users: {
        total: userStats[0]?.total_users || 0,
        active: userStats[0]?.active_users || 0
      },
      jobs: {
        total: jobStats[0]?.total_jobs || 0,
        active: jobStats[0]?.active_jobs || 0
      },
      applications: {
        total: applicationStats[0]?.total_applications || 0,
        pending: applicationStats[0]?.pending_applications || 0,
        shortlisted: applicationStats[0]?.shortlisted_applications || 0,
        interview: applicationStats[0]?.interview_applications || 0,
        hired: applicationStats[0]?.hired_applications || 0
      }
    };

    return successResponse(res, HTTP_STATUS.OK, 'System statistics retrieved successfully', stats);
  } catch (error) {
    console.error('Error fetching system statistics:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR], error);
  }
};

// Get system configuration (SuperAdmin only)
export const handleGetSystemConfig: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;

    if (!userId || !role) {
      return authErrorResponse(res, ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED]);
    }

    if (role !== 'SuperAdmin') {
      return authorizationErrorResponse(
        res,
        ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_PERMISSIONS],
        ['SuperAdmin']
      );
    }

    // Get system configuration
    const configResult = await executeQuery(`
      SELECT 
        site_name,
        site_description,
        contact_email,
        max_file_size_mb,
        supported_file_types
      FROM system_config
      WHERE id = 1
    `);

    if (configResult.length === 0) {
      return notFoundResponse(res, 'System configuration not found', 'System configuration');
    }

    const config = configResult[0];

    return successResponse(res, HTTP_STATUS.OK, 'System configuration retrieved successfully', config);
  } catch (error) {
    console.error('Error fetching system configuration:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR], error);
  }
};

// Get audit log (SuperAdmin only)
export const handleGetAuditLog: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    if (!userId || !role) {
      return authErrorResponse(res, ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED]);
    }

    if (role !== 'SuperAdmin') {
      return authorizationErrorResponse(
        res,
        ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_PERMISSIONS],
        ['SuperAdmin']
      );
    }

    // Build WHERE clause for date range
    let whereClause = "WHERE 1=1";
    let queryParams: any[] = [];

    if (startDate) {
      whereClause += " AND created_at >= ?";
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause += " AND created_at <= ?";
      queryParams.push(endDate);
    }

    // Get total count
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total
      FROM audit_logs
      ${whereClause}
    `, queryParams);

    // Get audit logs with pagination
    const auditResult = await executeQuery(`
      SELECT 
        al.id,
        al.action,
        al.table_name,
        al.record_id,
        al.old_values,
        al.new_values,
        al.changed_by_user_id,
        al.created_at,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.changed_by_user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    const total = countResult[0]?.total || 0;

    return successResponse(res, HTTP_STATUS.OK, 'Audit log retrieved successfully', {
      audit_logs: auditResult,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR], error);
  }
};

// Export data (SuperAdmin only)
export const handleExportData: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const { type } = req.query;

    if (!userId || !role) {
      return authErrorResponse(res, ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED]);
    }

    if (role !== 'SuperAdmin') {
      return authorizationErrorResponse(
        res,
        ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_PERMISSIONS],
        ['SuperAdmin']
      );
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="export-${type}-${new Date().toISOString().split('T')[0]}.csv"`);

    let data = '';
    let headers = '';

    switch (type) {
      case 'users':
        headers = 'ID,Email,Role,Status,Created At\n';
        
        const users = await executeQuery(`
          SELECT 
            u.id,
            u.email,
            r.name as role_name,
            u.is_active,
            u.created_at
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE u.deleted_at IS NULL
          ORDER BY u.created_at DESC
        `);

        data = users.map(user => 
          `${user.id},"${user.email}","${user.role_name}","${user.is_active ? 'Active' : 'Inactive'}","${user.created_at}"`
        ).join('\n');
        break;
        
      case 'applications':
        headers = 'ID,Job Title,Candidate Email,Status,Created At\n';
        
        const applications = await executeQuery(`
          SELECT 
            a.id,
            j.title as job_title,
            u.email as candidate_email,
            s.name as status_name,
            a.created_at
          FROM applications a
          JOIN job_posts j ON a.job_id = j.id
          JOIN users u ON a.candidate_user_id = u.id
          LEFT JOIN application_statuses s ON a.status_id = s.id
          WHERE a.deleted_at IS NULL
          ORDER BY a.created_at DESC
        `);

        data = applications.map(app => 
          `${app.id},"${app.job_title}","${app.candidate_email}","${app.status_name}","${app.created_at}"`
        ).join('\n');
        break;
        
      default:
        return errorResponse(
          res,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
          { type: 'Invalid export type. Must be users or applications' }
        );
    }

    res.send(headers + data);
  } catch (error) {
    console.error('Error exporting data:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR], error);
  }
};
