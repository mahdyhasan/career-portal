import { RequestHandler } from 'express';
import { AuthService } from '../services/authService';
import { User, Role, PaginatedResponse } from '@shared/api';
import { requireRole } from '../middleware/auth';
import { executeQuery, executeSingleQuery } from '../config/database';

// ==========================================
// USER MANAGEMENT
// ==========================================

export const handleCreateUser: RequestHandler = async (req, res) => {
  try {
    const { email, password, role_id, first_name, last_name, phone } = req.body;
    
    // Validate required fields
    if (!email || !password || !role_id) {
      return res.status(400).json({ 
        message: 'Email, password, and role_id are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format', 
        code: 'INVALID_EMAIL' 
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long', 
        code: 'SHORT_PASSWORD' 
      });
    }
    
    // Check if email already exists
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUser.length > 0) {
      return res.status(409).json({ 
        message: 'Email already exists', 
        code: 'EMAIL_EXISTS' 
      });
    }
    
    // Validate role exists
    const roleResult = await executeQuery(
      'SELECT id, name FROM roles WHERE id = ?',
      [role_id]
    );
    
    if (!roleResult.length) {
      return res.status(400).json({ 
        message: 'Invalid role', 
        code: 'INVALID_ROLE' 
      });
    }
    
    // Hash password using AuthService
    const password_hash = await AuthService.hashPassword(password);
    
    // Start transaction
    await executeSingleQuery('START TRANSACTION');
    
    try {
      // Create user
      const userResult = await executeSingleQuery(
        'INSERT INTO users (email, password_hash, role_id, is_active, created_at, updated_at) VALUES (?, ?, ?, TRUE, NOW(), NOW())',
        [email, password_hash, role_id]
      );
      
      // Create candidate profile if role is Candidate
      if (roleResult[0].name === 'Candidate' && (first_name || last_name || phone)) {
        await executeSingleQuery(
          'INSERT INTO candidate_profiles (user_id, first_name, last_name, phone, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [userResult.insertId, first_name || null, last_name || null, phone || null]
        );
      }
      
      await executeSingleQuery('COMMIT');
      
      res.status(201).json({ 
        message: 'User created successfully',
        user_id: userResult.insertId
      });
      
    } catch (error) {
      await executeSingleQuery('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      message: 'Failed to create user', 
      code: 'CREATE_USER_ERROR' 
    });
  }
};

export const handleGetUsers: RequestHandler = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role_id, is_active } = req.query;
    
    // Build query conditions
    let whereConditions = [];
    let params: any[] = [];
    
    if (search) {
      whereConditions.push('(u.email LIKE ? OR cp.first_name LIKE ? OR cp.last_name LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (role_id) {
      whereConditions.push('u.role_id = ?');
      params.push(role_id);
    }
    
    if (is_active !== undefined) {
      whereConditions.push('u.is_active = ?');
      params.push(is_active === 'true');
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM users u 
      LEFT JOIN candidate_profiles cp ON u.id = cp.user_id 
      ${whereClause}
    `;
    
    // Get users with pagination
    const offset = (Number(page) - 1) * Number(limit);
    const usersQuery = `
      SELECT 
        u.id, u.email, u.role_id, u.is_active, u.created_at, u.updated_at,
        r.name as role_name,
        cp.first_name, cp.last_name, cp.phone
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countResult = await executeQuery(countQuery, params);
    const usersResult = await executeQuery(usersQuery, [...params, Number(limit), offset]);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / Number(limit));
    
    const response: PaginatedResponse<User> = {
      data: usersResult,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', code: 'FETCH_USERS_ERROR' });
  }
};

export const handleUpdateUserStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active must be a boolean', code: 'INVALID_STATUS' });
    }
    
    // Check if user exists
    const existingUser = await executeQuery(
      'SELECT id, role_id FROM users WHERE id = ?',
      [id]
    );
    
    if (!existingUser.length) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }
    
    // Prevent deactivating other super admins unless you're the only one
    if (!is_active) {
      const superAdminCount = await executeQuery(
        'SELECT COUNT(*) as count FROM users WHERE role_id = (SELECT id FROM roles WHERE name = "SuperAdmin") AND is_active = TRUE'
      );
      
      const userRole = await executeQuery(
        'SELECT name FROM roles WHERE id = ?',
        [existingUser[0].role_id]
      );
      
      if (userRole[0]?.name === 'SuperAdmin' && superAdminCount[0].count <= 1) {
        return res.status(400).json({ 
          message: 'Cannot deactivate the last active super admin', 
          code: 'LAST_SUPER_ADMIN' 
        });
      }
    }
    
    await executeSingleQuery(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [is_active, id]
    );
    
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status', code: 'UPDATE_USER_ERROR' });
  }
};

export const handleUpdateUserRole: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;
    
    if (!role_id) {
      return res.status(400).json({ message: 'role_id is required', code: 'ROLE_ID_REQUIRED' });
    }
    
    // Validate role exists
    const roleResult = await executeQuery(
      'SELECT name FROM roles WHERE id = ?',
      [role_id]
    );
    
    if (!roleResult.length) {
      return res.status(400).json({ message: 'Invalid role', code: 'INVALID_ROLE' });
    }
    
    // Check if user exists
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (!existingUser.length) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }
    
    await executeSingleQuery(
      'UPDATE users SET role_id = ?, updated_at = NOW() WHERE id = ?',
      [role_id, id]
    );
    
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role', code: 'UPDATE_ROLE_ERROR' });
  }
};

// ==========================================
// SYSTEM STATISTICS
// ==========================================

export const handleGetSystemStats: RequestHandler = async (req, res) => {
  try {
    const stats = {};
    
    // User statistics
    const userStats = await executeQuery(`
      SELECT 
        r.name as role,
        COUNT(*) as count,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_count
      FROM users u
      JOIN roles r ON u.role_id = r.id
      GROUP BY r.name
    `);
    
    // Job statistics
    const jobStats = await executeQuery(`
      SELECT 
        js.name as status,
        COUNT(*) as count
      FROM jobs j
      JOIN job_statuses js ON j.status_id = js.id
      WHERE j.deleted_at IS NULL
      GROUP BY js.name
    `);
    
    // Application statistics
    const applicationStats = await executeQuery(`
      SELECT 
        aps.name as status,
        COUNT(*) as count
      FROM applications a
      JOIN application_statuses aps ON a.status_id = aps.id
      WHERE a.deleted_at IS NULL
      GROUP BY aps.name
    `);
    
    // Recent activity (last 30 days)
    const recentActivity = await executeQuery(`
      SELECT 
        'new_users' as type,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      
      UNION ALL
      
      SELECT 
        'new_jobs' as type,
        COUNT(*) as count
      FROM jobs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND deleted_at IS NULL
      
      UNION ALL
      
      SELECT 
        'new_applications' as type,
        COUNT(*) as count
      FROM applications 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND deleted_at IS NULL
    `);
    
    res.json({
      users: userStats,
      jobs: jobStats,
      applications: applicationStats,
      recentActivity: recentActivity.reduce((acc, item) => {
        acc[item.type] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ message: 'Failed to fetch system statistics', code: 'STATS_ERROR' });
  }
};

// ==========================================
// SYSTEM CONFIGURATION
// ==========================================

export const handleGetSystemConfig: RequestHandler = async (req, res) => {
  try {
    // This would typically come from a configuration table
    // For now, return basic system info
    const versionInfo = await executeQuery('SELECT VERSION() as db_version');
    const currentTime = await executeQuery('SELECT NOW() as server_time');
    
    res.json({
      database: {
        version: versionInfo[0].db_version,
        connection: 'active'
      },
      server: {
        time: currentTime[0].server_time,
        uptime: process.uptime()
      },
      features: {
        jobPostings: true,
        applications: true,
        fileUploads: true,
        socialAuth: true
      }
    });
  } catch (error) {
    console.error('Error fetching system config:', error);
    res.status(500).json({ message: 'Failed to fetch system configuration', code: 'CONFIG_ERROR' });
  }
};

// ==========================================
// AUDIT LOG
// ==========================================

export const handleGetAuditLog: RequestHandler = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, user_id, start_date, end_date } = req.query;
    
    let whereConditions = [];
    let params: any[] = [];
    
    if (action) {
      whereConditions.push('action = ?');
      params.push(action);
    }
    
    if (user_id) {
      whereConditions.push('user_id = ?');
      params.push(user_id);
    }
    
    if (start_date) {
      whereConditions.push('created_at >= ?');
      params.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('created_at <= ?');
      params.push(end_date);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // For now, return application history as audit log
    // In a real implementation, you'd have a dedicated audit_log table
    const query = `
      SELECT 
        ah.id,
        ah.application_id,
        ah.previous_status_id,
        ah.new_status_id,
        ah.changed_by_user_id as user_id,
        ah.notes,
        ah.created_at,
        u.email as user_email,
        r.name as user_role,
        'application_status_change' as action,
        CASE 
          WHEN ah.previous_status_id IS NULL THEN 'Application created'
          ELSE CONCAT('Status changed from ', ps.name, ' to ', ns.name)
        END as description
      FROM application_history ah
      JOIN users u ON ah.changed_by_user_id = u.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN application_statuses ps ON ah.previous_status_id = ps.id
      LEFT JOIN application_statuses ns ON ah.new_status_id = ns.id
      ${whereClause}
      ORDER BY ah.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const auditLog = await executeQuery(query, [...params, Number(limit), offset]);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM application_history ah
      JOIN users u ON ah.changed_by_user_id = u.id
      ${whereClause}
    `;
    
    const countResult = await executeQuery(countQuery, params);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / Number(limit));
    
    res.json({
      data: auditLog,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ message: 'Failed to fetch audit log', code: 'AUDIT_LOG_ERROR' });
  }
};

// ==========================================
// DATA MANAGEMENT
// ==========================================

export const handleExportData: RequestHandler = async (req, res) => {
  try {
    const { type } = req.query;
    
    switch (type) {
      case 'users':
        const users = await executeQuery(`
          SELECT 
            u.id, u.email, u.is_active, u.created_at,
            r.name as role,
            cp.first_name, cp.last_name, cp.phone, cp.bio
          FROM users u
          LEFT JOIN roles r ON u.role_id = r.id
          LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
          ORDER BY u.created_at DESC
        `);
        res.json({ data: users });
        break;
        
      case 'jobs':
        const jobs = await executeQuery(`
          SELECT 
            j.id, j.title, j.description, j.salary_range, j.location_text,
            j.created_at, j.updated_at,
            c.name as company,
            d.name as department,
            js.name as status
          FROM jobs j
          LEFT JOIN companies c ON j.company_id = c.id
          LEFT JOIN departments d ON j.department_id = d.id
          LEFT JOIN job_statuses js ON j.status_id = js.id
          WHERE j.deleted_at IS NULL
          ORDER BY j.created_at DESC
        `);
        res.json({ data: jobs });
        break;
        
      case 'applications':
        const applications = await executeQuery(`
          SELECT 
            a.id, a.created_at,
            j.title as job_title,
            u.email as candidate_email,
            aps.name as status
          FROM applications a
          LEFT JOIN jobs j ON a.job_id = j.id
          LEFT JOIN users u ON a.candidate_user_id = u.id
          LEFT JOIN application_statuses aps ON a.status_id = aps.id
          WHERE a.deleted_at IS NULL
          ORDER BY a.created_at DESC
        `);
        res.json({ data: applications });
        break;
        
      default:
        res.status(400).json({ message: 'Invalid export type', code: 'INVALID_EXPORT_TYPE' });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ message: 'Failed to export data', code: 'EXPORT_ERROR' });
  }
};
