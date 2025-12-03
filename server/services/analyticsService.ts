import pool from '../config/database';

export interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalJobs: number;
    totalApplications: number;
    totalInterviews: number;
    totalOffers: number;
  };
  recent: {
    recentUsers: any[];
    recentJobs: any[];
    recentApplications: any[];
  };
  trends: {
    applicationsByMonth: any[];
    jobsByMonth: any[];
    userRegistrationsByMonth: any[];
  };
  demographics: {
    usersByRole: any[];
    applicationsByStatus: any[];
    jobsByDepartment: any[];
  };
}

export interface JobAnalytics {
  jobId: number;
  title: string;
  totalApplications: number;
  applicationsByStatus: any[];
  conversionRate: number;
  averageTimeToHire: number;
  topSkills: any[];
  demographics: any[];
}

export interface UserAnalytics {
  userId: number;
  totalApplications: number;
  successRate: number;
  averageResponseTime: number;
  preferredJobTypes: any[];
  skillsMatch: number;
}

export class AnalyticsService {
  
  static async getSystemAnalytics(): Promise<AnalyticsData> {
    const [
      totalUsers,
      totalJobs,
      totalApplications,
      totalInterviews,
      totalOffers,
      recentUsers,
      recentJobs,
      recentApplications,
      applicationsByMonth,
      jobsByMonth,
      userRegistrationsByMonth,
      usersByRole,
      applicationsByStatus,
      jobsByDepartment
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getTotalJobs(),
      this.getTotalApplications(),
      this.getTotalInterviews(),
      this.getTotalOffers(),
      this.getRecentUsers(),
      this.getRecentJobs(),
      this.getRecentApplications(),
      this.getApplicationsByMonth(),
      this.getJobsByMonth(),
      this.getUserRegistrationsByMonth(),
      this.getUsersByRole(),
      this.getApplicationsByStatus(),
      this.getJobsByDepartment()
    ]);

    return {
      overview: {
        totalUsers,
        totalJobs,
        totalApplications,
        totalInterviews,
        totalOffers
      },
      recent: {
        recentUsers,
        recentJobs,
        recentApplications
      },
      trends: {
        applicationsByMonth,
        jobsByMonth,
        userRegistrationsByMonth
      },
      demographics: {
        usersByRole,
        applicationsByStatus,
        jobsByDepartment
      }
    };
  }

  static async getJobAnalytics(jobId: number): Promise<JobAnalytics> {
    const [
      jobDetails,
      totalApplications,
      applicationsByStatus,
      conversionRate,
      averageTimeToHire,
      topSkills,
      demographics
    ] = await Promise.all([
      this.getJobDetails(jobId),
      this.getJobApplicationCount(jobId),
      this.getJobApplicationsByStatus(jobId),
      this.getJobConversionRate(jobId),
      this.getAverageTimeToHire(jobId),
      this.getTopSkillsForJob(jobId),
      this.getJobApplicationDemographics(jobId)
    ]);

    return {
      jobId,
      title: jobDetails.title,
      totalApplications,
      applicationsByStatus,
      conversionRate,
      averageTimeToHire,
      topSkills,
      demographics
    };
  }

  static async getUserAnalytics(userId: number): Promise<UserAnalytics> {
    const [
      totalApplications,
      successRate,
      averageResponseTime,
      preferredJobTypes,
      skillsMatch
    ] = await Promise.all([
      this.getUserApplicationCount(userId),
      this.getUserSuccessRate(userId),
      this.getUserAverageResponseTime(userId),
      this.getUserPreferredJobTypes(userId),
      this.getUserSkillsMatch(userId)
    ]);

    return {
      userId,
      totalApplications,
      successRate,
      averageResponseTime,
      preferredJobTypes,
      skillsMatch
    };
  }

  static async recordApplicationStatusChange(applicationId: number, newStatus: string): Promise<void> {
    // This method can be used to track status changes for analytics
    await pool.execute(
      'INSERT INTO analytics_status_changes (application_id, status, changed_at) VALUES (?, ?, NOW())',
      [applicationId, newStatus]
    );
  }

  static async getDashboardStats(): Promise<any> {
    const [activeJobs, pendingApplications, scheduledInterviews, pendingOffers] = await Promise.all([
      this.getActiveJobsCount(),
      this.getPendingApplicationsCount(),
      this.getScheduledInterviewsCount(),
      this.getPendingOffersCount()
    ]);

    return {
      activeJobs,
      pendingApplications,
      scheduledInterviews,
      pendingOffers
    };
  }

  // Private helper methods
  private static async getTotalUsers(): Promise<number> {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM users');
    return rows[0].count;
  }

  private static async getTotalJobs(): Promise<number> {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM jobs');
    return rows[0].count;
  }

  private static async getTotalApplications(): Promise<number> {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM applications');
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

  private static async getRecentUsers(): Promise<any[]> {
    const [rows]: any = await pool.execute(
      'SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );
    return rows;
  }

  private static async getRecentJobs(): Promise<any[]> {
    const [rows]: any = await pool.execute(
      'SELECT j.*, u.first_name, u.last_name FROM jobs j JOIN users u ON j.created_by = u.id ORDER BY j.created_at DESC LIMIT 10'
    );
    return rows;
  }

  private static async getRecentApplications(): Promise<any[]> {
    const [rows]: any = await pool.execute(
      `SELECT 
        a.*, 
        j.title as job_title,
        u.first_name,
        u.last_name 
      FROM applications a 
      JOIN jobs j ON a.job_id = j.id 
      JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC LIMIT 10`
    );
    return rows;
  }

  private static async getApplicationsByMonth(): Promise<any[]> {
    const [rows]: any = await pool.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM applications 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month`
    );
    return rows;
  }

  private static async getJobsByMonth(): Promise<any[]> {
    const [rows]: any = await pool.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM jobs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month`
    );
    return rows;
  }

  private static async getUserRegistrationsByMonth(): Promise<any[]> {
    const [rows]: any = await pool.execute(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month`
    );
    return rows;
  }

  private static async getUsersByRole(): Promise<any[]> {
    const [rows]: any = await pool.execute(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );
    return rows;
  }

  private static async getApplicationsByStatus(): Promise<any[]> {
    const [rows]: any = await pool.execute(
      'SELECT status, COUNT(*) as count FROM applications GROUP BY status'
    );
    return rows;
  }

  private static async getJobsByDepartment(): Promise<any[]> {
    const [rows]: any = await pool.execute(
      `SELECT 
        d.name as department_name,
        COUNT(*) as count 
      FROM jobs j
      JOIN departments d ON j.department_id = d.id
      GROUP BY d.id`
    );
    return rows;
  }

  private static async getJobDetails(jobId: number): Promise<any> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM jobs WHERE id = ?',
      [jobId]
    );
    return rows[0] || {};
  }

  private static async getJobApplicationCount(jobId: number): Promise<number> {
    const [rows]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM applications WHERE job_id = ?',
      [jobId]
    );
    return rows[0].count;
  }

  private static async getJobApplicationsByStatus(jobId: number): Promise<any[]> {
    const [rows]: any = await pool.execute(
      'SELECT status, COUNT(*) as count FROM applications WHERE job_id = ? GROUP BY status',
      [jobId]
    );
    return rows;
  }

  private static async getJobConversionRate(jobId: number): Promise<number> {
    const [rows]: any = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('hired', 'offer_accepted') THEN 1 ELSE 0 END) as successful
      FROM applications 
      WHERE job_id = ?`,
      [jobId]
    );
    
    const total = rows[0].total;
    const successful = rows[0].successful;
    
    return total > 0 ? (successful / total) * 100 : 0;
  }

  private static async getAverageTimeToHire(jobId: number): Promise<number> {
    const [rows]: any = await pool.execute(
      `SELECT 
        AVG(TIMESTAMPDIFF(DAY, created_at, updated_at)) as avg_days
      FROM applications 
      WHERE job_id = ? AND status IN ('hired', 'offer_accepted')`,
      [jobId]
    );
    
    return rows[0].avg_days || 0;
  }

  private static async getTopSkillsForJob(jobId: number): Promise<any[]> {
    const [rows]: any = await pool.execute(
      `SELECT 
        s.name as skill_name,
        COUNT(*) as count
      FROM application_skills aps
      JOIN applications ap ON aps.application_id = ap.id
      JOIN skills s ON aps.skill_id = s.id
      WHERE ap.job_id = ?
      GROUP BY s.id
      ORDER BY count DESC
      LIMIT 10`
    );
    return rows;
  }

  private static async getJobApplicationDemographics(jobId: number): Promise<any[]> {
    const [rows]: any = await pool.execute(
      `SELECT 
        c.name as city_name,
        COUNT(*) as count
      FROM applications ap
      JOIN users u ON ap.user_id = u.id
      JOIN cities c ON u.city_id = c.id
      WHERE ap.job_id = ?
      GROUP BY c.id`
    );
    return rows;
  }

  private static async getUserApplicationCount(userId: number): Promise<number> {
    const [rows]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM applications WHERE user_id = ?',
      [userId]
    );
    return rows[0].count;
  }

  private static async getUserSuccessRate(userId: number): Promise<number> {
    const [rows]: any = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('hired', 'offer_accepted') THEN 1 ELSE 0 END) as successful
      FROM applications 
      WHERE user_id = ?`,
      [userId]
    );
    
    const total = rows[0].total;
    const successful = rows[0].successful;
    
    return total > 0 ? (successful / total) * 100 : 0;
  }

  private static async getUserAverageResponseTime(userId: number): Promise<number> {
    const [rows]: any = await pool.execute(
      `SELECT 
        AVG(TIMESTAMPDIFF(DAY, created_at, updated_at)) as avg_days
      FROM applications 
      WHERE user_id = ? AND status NOT IN ('pending', 'draft')`,
      [userId]
    );
    
    return rows[0].avg_days || 0;
  }

  private static async getUserPreferredJobTypes(userId: number): Promise<any[]> {
    const [rows]: any = await pool.execute(
      `SELECT 
        jt.name as job_type,
        COUNT(*) as count
      FROM applications ap
      JOIN jobs j ON ap.job_id = j.id
      JOIN job_types jt ON j.job_type_id = jt.id
      WHERE ap.user_id = ?
      GROUP BY jt.id
      ORDER BY count DESC`
    );
    return rows;
  }

  private static async getUserSkillsMatch(userId: number): Promise<number> {
    // This would calculate how well user's skills match with applied jobs
    // Implementation would depend on the specific requirements
    return 85; // Placeholder
  }

  private static async getActiveJobsCount(): Promise<number> {
    const [rows]: any = await pool.execute(
      "SELECT COUNT(*) as count FROM jobs WHERE status = 'active'"
    );
    return rows[0].count;
  }

  private static async getPendingApplicationsCount(): Promise<number> {
    const [rows]: any = await pool.execute(
      "SELECT COUNT(*) as count FROM applications WHERE status = 'pending'"
    );
    return rows[0].count;
  }

  private static async getScheduledInterviewsCount(): Promise<number> {
    const [rows]: any = await pool.execute(
      "SELECT COUNT(*) as count FROM interviews WHERE status = 'scheduled'"
    );
    return rows[0].count;
  }

  private static async getPendingOffersCount(): Promise<number> {
    const [rows]: any = await pool.execute(
      "SELECT COUNT(*) as count FROM job_offers WHERE status = 'pending'"
    );
    return rows[0].count;
  }
}
