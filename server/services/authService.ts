import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery, executeSingleQuery, findOne } from '../config/database';
import { User, AuthResponse, LoginRequest, SignupRequest } from '@shared/api';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  // Generate JWT token
  static generateToken(user: User): string {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role?.name 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Compare password
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Find user by email
  static async findUserByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT u.*, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ? AND u.deleted_at IS NULL
    `;
    
    const user = await findOne<any>(query, [email]);
    
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      role_id: user.role_id,
      google_id: user.google_id,
      linkedin_id: user.linkedin_id,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      deleted_at: user.deleted_at,
      role: {
        id: user.role_id,
        name: user.role_name
      }
    };
  }

  // Find user by ID
  static async findUserById(id: number): Promise<User | null> {
    const query = `
      SELECT u.*, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ? AND u.deleted_at IS NULL
    `;
    
    const user = await findOne<any>(query, [id]);
    
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      role_id: user.role_id,
      google_id: user.google_id,
      linkedin_id: user.linkedin_id,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      deleted_at: user.deleted_at,
      role: {
        id: user.role_id,
        name: user.role_name
      }
    };
  }

  // Register new user
  static async registerUser(userData: SignupRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Get role ID
    const roleQuery = 'SELECT id FROM roles WHERE name = ?';
    const role = await findOne<any>(roleQuery, [userData.role]);
    if (!role) {
      throw new Error('Invalid role');
    }

    // Hash password
    const passwordHash = await this.hashPassword(userData.password);

    // Create user
    const insertQuery = `
      INSERT INTO users (email, password_hash, role_id, is_active)
      VALUES (?, ?, ?, 1)
    `;
    const result = await executeSingleQuery(insertQuery, [
      userData.email,
      passwordHash,
      role.id
    ]);

    const userId = result.insertId;

    // If candidate, create candidate profile
    if (userData.role === 'Candidate' && (userData.firstName || userData.lastName)) {
      const profileQuery = `
        INSERT INTO candidate_profiles (user_id, first_name, last_name)
        VALUES (?, ?, ?)
      `;
      await executeQuery(profileQuery, [userId, userData.firstName, userData.lastName]);
    }

    // Get created user
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('Failed to create user');
    }

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  // Login user
  static async loginUser(loginData: LoginRequest): Promise<AuthResponse> {
    const user = await this.findUserByEmail(loginData.email);
    
    if (!user || !user.password_hash) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(loginData.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    const token = this.generateToken(user);
    
    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  }

  // Social login/register
  static async socialLogin(
    email: string,
    provider: 'google' | 'linkedin',
    providerId: string,
    profile?: { firstName?: string; lastName?: string }
  ): Promise<AuthResponse> {
    let user = await this.findUserByEmail(email);

    if (!user) {
      // Register new user
      const roleQuery = 'SELECT id FROM roles WHERE name = "Candidate"';
      const role = await findOne<any>(roleQuery);
      
      if (!role) {
        throw new Error('Default role not found');
      }

      const insertQuery = `
        INSERT INTO users (email, role_id, ${provider}_id, is_active)
        VALUES (?, ?, ?, 1)
      `;
      const result = await executeSingleQuery(insertQuery, [
        email,
        role.id,
        providerId
      ]);

      const userId = result.insertId;

      // Create candidate profile if profile data provided
      if (profile?.firstName || profile?.lastName) {
        const profileQuery = `
          INSERT INTO candidate_profiles (user_id, first_name, last_name)
          VALUES (?, ?, ?)
        `;
        await executeQuery(profileQuery, [userId, profile.firstName, profile.lastName]);
      }

      user = await this.findUserById(userId);
    } else {
      // Update provider ID if not set
      const updateField = provider === 'google' ? 'google_id' : 'linkedin_id';
      const updateQuery = `UPDATE users SET ${updateField} = ? WHERE id = ?`;
      await executeQuery(updateQuery, [providerId, user.id]);
      
      user = await this.findUserById(user.id);
    }

    if (!user) {
      throw new Error('Failed to create/find user');
    }

    const token = this.generateToken(user);
    
    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  }
}
