import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
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
      SELECT u.*, r.name as role_name, r.id as role_id
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
      SELECT u.*, r.name as role_name, r.id as role_id
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
    console.log('AuthService.registerUser called with:', userData);
    
    // Check if user already exists
    const existingUser = await this.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Get role ID
    const roleQuery = 'SELECT id FROM roles WHERE name = ?';
    const role = await findOne<any>(roleQuery, [userData.role]);
    console.log('Found role:', role);
    
    if (!role) {
      throw new Error('Invalid role');
    }

    // Hash password
    const passwordHash = await this.hashPassword(userData.password);
    console.log('Password hashed successfully');

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
    console.log('User created with ID:', userId);

    // If candidate, create candidate profile
    if (userData.role === 'Candidate') {
      console.log('Creating candidate profile for user:', userId, 'with names:', userData.firstName, userData.lastName);
      const profileQuery = `
        INSERT INTO candidate_profiles (user_id, first_name, last_name)
        VALUES (?, ?, ?)
      `;
      await executeQuery(profileQuery, [userId, userData.firstName || null, userData.lastName || null]);
      console.log('Candidate profile created successfully');
    }

    // Get created user
    const user = await this.findUserById(userId);
    console.log('Retrieved created user:', user);
    
    if (!user) {
      throw new Error('Failed to create user');
    }

    // Generate token
    const token = this.generateToken(user);
    console.log('Token generated successfully');

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

  // Generate 6-digit OTP
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP in database (for demo purposes, using a simple approach)
  static async storeOTP(email: string, otp: string): Promise<void> {
    const query = `
      INSERT INTO otp_codes (email, otp, expires_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
      ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at)
    `;
    await executeQuery(query, [email, otp]);
  }

  // Verify OTP
  static async verifyOTP(email: string, otp: string): Promise<{ valid: boolean }> {
    const query = `
      SELECT id FROM otp_codes 
      WHERE email = ? AND otp = ? AND expires_at > NOW()
    `;
    const result = await findOne<any>(query, [email, otp]);
    
    if (!result) {
      throw new Error('Invalid or expired OTP');
    }

    // Delete the used OTP
    await executeQuery('DELETE FROM otp_codes WHERE email = ?', [email]);
    
    return { valid: true };
  }

  // Send OTP via email
  static async sendOTP(email: string): Promise<{ message: string }> {
    const otp = this.generateOTP();
    
    // Store OTP in database
    await this.storeOTP(email, otp);

    // Send email (for development, we'll just log it)
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${email}: ${otp}`);
      return { message: 'OTP sent successfully (check console for development)' };
    }

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@augmex.io',
      to: email,
      subject: 'Augmex - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Thank you for signing up with Augmex! Please use the following verification code to complete your registration:
            </p>
            <div style="background: #fff; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 2px;">
                ${otp}
              </span>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { message: 'OTP sent successfully to your email' };
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error('Failed to send OTP email');
    }
  }
}
