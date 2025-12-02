// server/routes/users.ts
import { RequestHandler } from 'express';
import { executeQuery, executeSingleQuery, findOne } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { User, Role, PaginatedResponse } from '@shared/api';

// Get all users with pagination and filters
export const handleGetUsers: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.email, u.is_active, u.created_at, u.updated_at,
             r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.deleted_at IS NULL
    `;

    const params: any[] = [];

    // Apply filters
    if (req.query.search) {
      query += ' AND u.email LIKE ?';
      params.push(`%${req.query.search}%`);
    }

    if (req.query.role) {
      query += ' AND r.name = ?';
      params.push(req.query.role);
    }

    if (req.query.is_active !== undefined) {
      query += ' AND u.is_active = ?';
      params.push(req.query.is_active === 'true');
    }

    query += ` ORDER BY u.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const users = await executeQuery<any>(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.deleted_at IS NULL
    `;

    const countParams: any[] = [];
    let countFilterQuery = '';

    if (req.query.search) {
      countFilterQuery += ' AND u.email LIKE ?';
      countParams.push(`%${req.query.search}%`);
    }

    if (req.query.role) {
      countFilterQuery += ' AND r.name = ?';
      countParams.push(req.query.role);
    }

    if (req.query.is_active !== undefined) {
      countFilterQuery += ' AND u.is_active = ?';
      countParams.push(req.query.is_active === 'true');
    }

    const totalResult = await findOne<{ total: number }>(
      countQuery + countFilterQuery, 
      countParams
    );

    const response: PaginatedResponse<User> = {
      data: users.map(user => ({
        ...user,
        role: { id: user.role_id, name: user.role_name }
      })),
      total: totalResult?.total || 0,
      page,
      limit,
      totalPages: Math.ceil((totalResult?.total || 0) / limit)
    };

    res.json(response);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Failed to fetch users',
      code: 'FETCH_USERS_FAILED'
    });
  }
};

// Get user by ID
export const handleGetUser: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const user = await findOne<any>(`
      SELECT u.id, u.email, u.is_active, u.created_at, u.updated_at,
             r.id as role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ? AND u.deleted_at IS NULL
    `, [userId]);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    user.role = { id: user.role_id, name: user.role_name };

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      message: 'Failed to fetch user',
      code: 'FETCH_USER_FAILED'
    });
  }
};

// Create new user (SuperAdmin only)
export const handleCreateUser: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const { email, role_name } = req.body;

    if (!email || !role_name) {
      return res.status(400).json({
        message: 'Email and role are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if user already exists
    const existingUser = await findOne<any>(`
      SELECT id FROM users WHERE email = ? AND deleted_at IS NULL
    `, [email]);

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Get role ID
    const role = await findOne<any>(`
      SELECT id FROM roles WHERE name = ? LIMIT 1
    `, [role_name]);

    if (!role) {
      return res.status(400).json({
        message: 'Invalid role',
        code: 'INVALID_ROLE'
      });
    }

    // Create user with a temporary password that must be changed
    const tempPassword = 'TempPassword123!'; // In production, generate a secure random password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const insertResult = await executeSingleQuery(`
      INSERT INTO users (email, password_hash, role_id, is_active)
      VALUES (?, ?, ?, ?)
    `, [email, hashedPassword, role.id, true]);

    const createdUser = await findOne<any>(`
      SELECT u.id, u.email, u.is_active, u.created_at,
             r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [insertResult.insertId]);

    createdUser.role = { id: role.id, name: role_name };

    res.status(201).json({
      ...createdUser,
      temp_password: tempPassword // Only returned once for secure delivery
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      message: 'Failed to create user',
      code: 'CREATE_USER_FAILED'
    });
  }
};

// Update user status (activate/deactivate)
export const handleUpdateUserStatus: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { is_active } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        message: 'is_active must be a boolean',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if user exists
    const existingUser = await findOne<any>(`
      SELECT id FROM users WHERE id = ? AND deleted_at IS NULL
    `, [userId]);

    if (!existingUser) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Prevent SuperAdmin from deactivating themselves
    if (userId === req.user?.id && !is_active) {
      return res.status(400).json({
        message: 'You cannot deactivate your own account',
        code: 'CANNOT_DEACTIVATE_SELF'
      });
    }

    await executeQuery(`
      UPDATE users 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [is_active, userId]);

    res.json({
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      user_id: userId,
      is_active
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      message: 'Failed to update user status',
      code: 'UPDATE_USER_STATUS_FAILED'
    });
  }
};

// Update user role
export const handleUpdateUserRole: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role_name } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!role_name) {
      return res.status(400).json({
        message: 'Role name is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get role ID
    const role = await findOne<any>(`
      SELECT id FROM roles WHERE name = ? LIMIT 1
    `, [role_name]);

    if (!role) {
      return res.status(400).json({
        message: 'Invalid role',
        code: 'INVALID_ROLE'
      });
    }

    // Check if user exists
    const existingUser = await findOne<any>(`
      SELECT id FROM users WHERE id = ? AND deleted_at IS NULL
    `, [userId]);

    if (!existingUser) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Prevent SuperAdmin from changing their own role
    if (userId === req.user?.id) {
      return res.status(400).json({
        message: 'You cannot change your own role',
        code: 'CANNOT_CHANGE_OWN_ROLE'
      });
    }

    await executeQuery(`
      UPDATE users 
      SET role_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [role.id, userId]);

    res.json({
      message: 'User role updated successfully',
      user_id: userId,
      new_role: role_name
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      message: 'Failed to update user role',
      code: 'UPDATE_USER_ROLE_FAILED'
    });
  }
};

// Delete user (soft delete)
export const handleDeleteUser: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if user exists
    const existingUser = await findOne<any>(`
      SELECT id FROM users WHERE id = ? AND deleted_at IS NULL
    `, [userId]);

    if (!existingUser) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Prevent SuperAdmin from deleting themselves
    if (userId === req.user?.id) {
      return res.status(400).json({
        message: 'You cannot delete your own account',
        code: 'CANNOT_DELETE_SELF'
      });
    }

    await executeQuery(`
      UPDATE users 
      SET deleted_at = CURRENT_TIMESTAMP, is_active = false
      WHERE id = ?
    `, [userId]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Failed to delete user',
      code: 'DELETE_USER_FAILED'
    });
  }
};
