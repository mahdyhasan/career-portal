import pool from '../config/database';
import bcrypt from 'bcryptjs';

export interface SystemSettings {
  companyName: string;
  companyLogo: string;
  primaryColor: string;
  secondaryColor: string;
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
  };
  notificationSettings: {
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    notificationFrequency: string;
  };
  securitySettings: {
    passwordMinLength: number;
    requireComplexPassword: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  resource: string;
  resourceId?: number;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export class AdminService {
  
  static async getSystemSettings(): Promise<SystemSettings> {
    const [rows]: any = await pool.execute('SELECT * FROM system_settings');
    
    if (rows.length === 0) {
      return this.getDefaultSettings();
    }

    const settings = rows[0];
    return {
      companyName: settings.company_name,
      companyLogo: settings.company_logo,
      primaryColor: settings.primary_color,
      secondaryColor: settings.secondary_color,
      emailSettings: JSON.parse(settings.email_settings || '{}'),
      notificationSettings: JSON.parse(settings.notification_settings || '{}'),
      securitySettings: JSON.parse(settings.security_settings || '{}')
    };
  }

  static async updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const existingSettings = await this.getSystemSettings();
      const updatedSettings = { ...existingSettings, ...settings };

      await connection.execute(
        `INSERT INTO system_settings (
          company_name, company_logo, primary_color, secondary_color,
          email_settings, notification_settings, security_settings, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          company_name = VALUES(company_name),
          company_logo = VALUES(company_logo),
          primary_color = VALUES(primary_color),
          secondary_color = VALUES(secondary_color),
          email_settings = VALUES(email_settings),
          notification_settings = VALUES(notification_settings),
          security_settings = VALUES(security_settings),
          updated_at = VALUES(updated_at)`,
        [
          updatedSettings.companyName,
          updatedSettings.companyLogo,
          updatedSettings.primaryColor,
          updatedSettings.secondaryColor,
          JSON.stringify(updatedSettings.emailSettings),
          JSON.stringify(updatedSettings.notificationSettings),
          JSON.stringify(updatedSettings.securitySettings)
        ]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    departmentId?: number;
    phone?: string;
    cityId?: number;
  }): Promise<number> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if email already exists
      const [existingUsers]: any = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [userData.email]
      );
      
      if (existingUsers.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Insert user
      const [result]: any = await connection.execute(
        `INSERT INTO users (
          first_name, last_name, email, password, role, 
          department_id, phone, city_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userData.firstName,
          userData.lastName,
          userData.email,
          hashedPassword,
          userData.role,
          userData.departmentId,
          userData.phone,
          userData.cityId
        ]
      );

      const userId = result.insertId;

      // Log the action
      await this.logAction(
        0, // System user
        'create',
        'users',
        userId,
        { userData: { ...userData, password: '[REDACTED]' } }
      );

      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateUser(userId: number, updates: any): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Build dynamic update query
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      await connection.execute(
        `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`,
        [...values, userId]
      );

      // Log the action
      await this.logAction(
        0, // System user
        'update',
        'users',
        userId,
        { updates }
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async deleteUser(userId: number): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Soft delete (update status)
      await connection.execute(
        'UPDATE users SET status = "deleted", updated_at = NOW() WHERE id = ?',
        [userId]
      );

      // Log the action
      await this.logAction(
        0, // System user
        'delete',
        'users',
        userId,
        { reason: 'Admin deletion' }
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async manageReferenceData(table: string, action: string, data: any, id?: number): Promise<any> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      let result;
      
      switch (action) {
        case 'create':
          const [createResult]: any = await connection.execute(
            `INSERT INTO ${table} (name, created_at, updated_at) VALUES (?, NOW(), NOW())`,
            [data.name]
          );
          result = { id: createResult.insertId };
          break;
          
        case 'update':
          await connection.execute(
            `UPDATE ${table} SET name = ?, updated_at = NOW() WHERE id = ?`,
            [data.name, id]
          );
          result = { id };
          break;
          
        case 'delete':
          await connection.execute(
            `DELETE FROM ${table} WHERE id = ?`,
            [id]
          );
          result = { deleted: true };
          break;
          
        default:
          throw new Error('Invalid action');
      }

      // Log the action
      await this.logAction(
        0, // System user
        action,
        table,
        id,
        { data }
      );

      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getSystemStats(): Promise<any> {
    const [
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      totalInterviews,
      totalOffers
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getActiveUsers(),
      this.getTotalJobs(),
      this.getActiveJobs(),
      this.getTotalApplications(),
      this.getPendingApplications(),
      this.getTotalInterviews(),
      this.getTotalOffers()
    ]);

    return {
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      totalInterviews,
      totalOffers
    };
  }

  static async getAuditLogs(filters: {
    userId?: number;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; totalCount: number }> {
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (filters.userId) {
      whereConditions.push('user_id = ?');
      params.push(filters.userId);
    }

    if (filters.action) {
      whereConditions.push('action = ?');
      params.push(filters.action);
    }

    if (filters.resource) {
      whereConditions.push('resource = ?');
      params.push(filters.resource);
    }

    if (filters.startDate) {
      whereConditions.push('created_at >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereConditions.push('created_at <= ?');
      params.push(filters.endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM audit_logs
      ${whereClause}
    `;
    
    const [countRows]: any = await pool.execute(countQuery, params);
    const totalCount = countRows[0].count;

    // Get the logs
    const query = `
      SELECT 
        al.*,
        u.first_name,
        u.last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows]: any = await pool.execute(query, [...params, limit, offset]);
    
    const logs: AuditLog[] = rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id,
      details: JSON.parse(row.details || '{}'),
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      userName: row.first_name ? `${row.first_name} ${row.last_name}` : 'System'
    }));

    return { logs, totalCount };
  }

  static async logAction(
    userId: number,
    action: string,
    resource: string,
    resourceId?: number,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await pool.execute(
      `INSERT INTO audit_logs (
        user_id, action, resource, resource_id, details,
        ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        action,
        resource,
        resourceId,
        JSON.stringify(details || {}),
        ipAddress || '',
        userAgent || ''
      ]
    );
  }

  static async backupDatabase(): Promise<string> {
    // This would typically integrate with a database backup service
    // For now, we'll create a simple backup record
    const backupId = `backup_${Date.now()}`;
    
    await pool.execute(
      'INSERT INTO database_backups (backup_id, created_at, status) VALUES (?, NOW(), "completed")',
      [backupId]
    );

    return backupId;
  }

  static async getSystemHealth(): Promise<any> {
    const [
      databaseStatus,
      lastBackup,
      systemLoad,
      memoryUsage
    ] = await Promise.all([
      this.checkDatabaseStatus(),
      this.getLastBackup(),
      this.getSystemLoad(),
      this.getMemoryUsage()
    ]);

    return {
      databaseStatus,
      lastBackup,
      systemLoad,
      memoryUsage,
      timestamp: new Date()
    };
  }

  private static getDefaultSettings(): SystemSettings {
    return {
      companyName: 'Career Portal',
      companyLogo: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      emailSettings: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: '',
        smtpPass: '',
        fromEmail: 'noreply@careerportal.com'
      },
      notificationSettings: {
        enableEmailNotifications: true,
        enablePushNotifications: true,
        notificationFrequency: 'immediate'
      },
      securitySettings: {
        passwordMinLength: 8,
        requireComplexPassword: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5
      }
    };
  }

  private static async getTotalUsers(): Promise<number> {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM users WHERE status != "deleted"');
    return rows[0].count;
  }

  private static async getActiveUsers(): Promise<number> {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM users WHERE status = "active"');
    return rows[0].count;
  }

  private static async getTotalJobs(): Promise<number> {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM jobs');
    return rows[0].count;
  }

  private static async getActiveJobs(): Promise<number> {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM jobs WHERE status = "active"');
    return rows[0].count;
  }

  private static async getTotalApplications(): Promise<number> {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM applications');
    return rows[0].count;
  }

  private static async getPendingApplications(): Promise<number> {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM applications WHERE status = "pending"');
    return rows[0].count;
  }

  private static async getTotalInterviews(): Promise<number> {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM interviews');
    return rows[0].count;
  }

  private static async getTotalOffers(): Promise<number> {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM job_offers');
    return rows[0].count;
  }

  private static async checkDatabaseStatus(): Promise<string> {
    try {
      await pool.execute('SELECT 1');
      return 'healthy';
    } catch (error) {
      return 'unhealthy';
    }
  }

  private static async getLastBackup(): Promise<any> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM database_backups ORDER BY created_at DESC LIMIT 1'
    );
    return rows[0] || null;
  }

  private static async getSystemLoad(): Promise<number> {
    // This would typically get system load information
    // For now, return a placeholder
    return 0.5;
  }

  private static async getMemoryUsage(): Promise<any> {
    // This would typically get memory usage information
    // For now, return placeholder data
    return {
      used: 1024,
      total: 4096,
      percentage: 25
    };
  }
}
