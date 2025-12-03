import pool from '../config/database';
import { EmailService } from './emailService';
import { NotificationService } from './notificationService';
import { AnalyticsService } from './analyticsService';

export interface ApplicationWorkflowData {
  applicationId: number;
  candidateId: number;
  jobId: number;
  hiringManagerId: number;
  currentStatus: string;
  nextAction: string;
  scheduledDate?: Date;
  notes?: string;
  interviewType?: 'phone' | 'video' | 'in-person' | 'technical' | 'final';
  interviewers?: string[];
  location?: string;
  meetingLink?: string;
}

export interface WorkflowHistory {
  id: number;
  applicationId: number;
  status: string;
  action: string;
  performedBy: number;
  performedAt: Date;
  notes?: string;
}

export class ApplicationWorkflowService {
  
  static async updateApplicationStatus(
    applicationId: number,
    newStatus: string,
    performedBy: number,
    notes?: string
  ): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get current application data
      const [applicationRows]: any = await connection.execute(
        'SELECT * FROM applications WHERE id = ?',
        [applicationId]
      );
      
      if (applicationRows.length === 0) {
        throw new Error('Application not found');
      }
      
      const application = applicationRows[0];
      
      // Update application status
      await connection.execute(
        'UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, applicationId]
      );
      
      // Log the status change
      await connection.execute(
        'INSERT INTO application_workflow_history (application_id, status, action, performed_by, performed_at, notes) VALUES (?, ?, ?, ?, NOW(), ?)',
        [applicationId, newStatus, 'status_change', performedBy, notes || '']
      );
      
      // Send notifications based on status
      await this.sendStatusNotifications(application, newStatus);
      
      // Update analytics
      await AnalyticsService.recordApplicationStatusChange(applicationId, newStatus);
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async scheduleInterview(data: ApplicationWorkflowData): Promise<number> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Insert interview record
      const [result]: any = await connection.execute(
        `INSERT INTO interviews (
          application_id, interview_type, scheduled_date, location, 
          meeting_link, interviewers, notes, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', NOW(), NOW())`,
        [
          data.applicationId,
          data.interviewType,
          data.scheduledDate,
          data.location,
          data.meetingLink,
          JSON.stringify(data.interviewers || []),
          data.notes || ''
        ]
      );
      
      const interviewId = result.insertId;
      
      // Update application status
      await connection.execute(
        'UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?',
        ['interview_scheduled', data.applicationId]
      );
      
      // Log the action
      await connection.execute(
        'INSERT INTO application_workflow_history (application_id, status, action, performed_by, performed_at, notes) VALUES (?, ?, ?, ?, NOW(), ?)',
        [data.applicationId, 'interview_scheduled', 'schedule_interview', data.hiringManagerId, data.notes || '']
      );
      
      // Send interview notifications
      await this.sendInterviewNotifications(data, interviewId);
      
      await connection.commit();
      return interviewId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateInterviewStatus(
    interviewId: number,
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show',
    notes?: string,
    performedBy?: number
  ): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update interview status
      await connection.execute(
        'UPDATE interviews SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?',
        [status, notes || '', interviewId]
      );
      
      // Get interview and application data
      const [interviewRows]: any = await connection.execute(
        'SELECT i.*, a.id as application_id FROM interviews i JOIN applications a ON i.application_id = a.id WHERE i.id = ?',
        [interviewId]
      );
      
      if (interviewRows.length === 0) {
        throw new Error('Interview not found');
      }
      
      const interview = interviewRows[0];
      
      // Update application status based on interview outcome
      let newApplicationStatus = interview.status;
      if (status === 'completed') {
        newApplicationStatus = 'interview_completed';
      } else if (status === 'no_show') {
        newApplicationStatus = 'candidate_no_show';
      }
      
      await connection.execute(
        'UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?',
        [newApplicationStatus, interview.application_id]
      );
      
      // Log the action
      if (performedBy) {
        await connection.execute(
          'INSERT INTO application_workflow_history (application_id, status, action, performed_by, performed_at, notes) VALUES (?, ?, ?, ?, NOW(), ?)',
          [interview.application_id, newApplicationStatus, 'update_interview', performedBy, notes || '']
        );
      }
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async makeJobOffer(
    applicationId: number,
    offerDetails: {
      salary: number;
      startDate: Date;
      benefits?: string;
      conditions?: string;
    },
    performedBy: number
  ): Promise<number> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Insert job offer
      const [result]: any = await connection.execute(
        `INSERT INTO job_offers (
          application_id, salary, start_date, benefits, conditions, 
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
        [
          applicationId,
          offerDetails.salary,
          offerDetails.startDate,
          offerDetails.benefits || '',
          offerDetails.conditions || ''
        ]
      );
      
      const offerId = result.insertId;
      
      // Update application status
      await connection.execute(
        'UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?',
        ['offer_made', applicationId]
      );
      
      // Log the action
      await connection.execute(
        'INSERT INTO application_workflow_history (application_id, status, action, performed_by, performed_at, notes) VALUES (?, ?, ?, ?, NOW(), ?)',
        [applicationId, 'offer_made', 'make_offer', performedBy, 'Job offer created']
      );
      
      // Send offer notification
      await this.sendOfferNotification(applicationId, offerDetails);
      
      await connection.commit();
      return offerId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async respondToOffer(
    offerId: number,
    response: 'accepted' | 'rejected' | 'negotiating',
    candidateId: number,
    notes?: string
  ): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update offer status
      await connection.execute(
        'UPDATE job_offers SET status = ?, response_notes = ?, updated_at = NOW() WHERE id = ?',
        [response, notes || '', offerId]
      );
      
      // Get application data
      const [offerRows]: any = await connection.execute(
        'SELECT application_id FROM job_offers WHERE id = ?',
        [offerId]
      );
      
      if (offerRows.length === 0) {
        throw new Error('Offer not found');
      }
      
      const applicationId = offerRows[0].application_id;
      
      // Update application status based on response
      let newStatus = 'offer_' + response;
      await connection.execute(
        'UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, applicationId]
      );
      
      // Log the action
      await connection.execute(
        'INSERT INTO application_workflow_history (application_id, status, action, performed_by, performed_at, notes) VALUES (?, ?, ?, ?, NOW(), ?)',
        [applicationId, newStatus, 'respond_to_offer', candidateId, notes || '']
      );
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getApplicationWorkflowHistory(applicationId: number): Promise<WorkflowHistory[]> {
    const [rows]: any = await pool.execute(
      `SELECT 
        awh.*, 
        u.first_name, 
        u.last_name 
      FROM application_workflow_history awh
      JOIN users u ON awh.performed_by = u.id
      WHERE awh.application_id = ?
      ORDER BY awh.performed_at DESC`,
      [applicationId]
    );
    
    return rows.map((row: any) => ({
      id: row.id,
      applicationId: row.application_id,
      status: row.status,
      action: row.action,
      performedBy: row.performed_by,
      performedAt: row.performed_at,
      notes: row.notes,
      performedByName: `${row.first_name} ${row.last_name}`
    }));
  }

  static async getUpcomingInterviews(userId: number, role: string): Promise<any[]> {
    let query: string;
    let params: any[];
    
    if (role === 'SuperAdmin' || role === 'HiringManager') {
      // Get interviews for jobs managed by this user
      query = `
        SELECT 
          i.*, 
          j.title as job_title,
          u.first_name as candidate_first_name,
          u.last_name as candidate_last_name,
          u.email as candidate_email
        FROM interviews i
        JOIN applications a ON i.application_id = a.id
        JOIN jobs j ON a.job_id = j.id
        JOIN users u ON a.user_id = u.id
        WHERE j.created_by = ? AND i.status = 'scheduled'
        ORDER BY i.scheduled_date ASC
      `;
      params = [userId];
    } else {
      // Get interviews for candidate
      query = `
        SELECT 
          i.*, 
          j.title as job_title,
          u.first_name as manager_first_name,
          u.last_name as manager_last_name
        FROM interviews i
        JOIN applications a ON i.application_id = a.id
        JOIN jobs j ON a.job_id = j.id
        JOIN users u ON j.created_by = u.id
        WHERE a.user_id = ? AND i.status = 'scheduled'
        ORDER BY i.scheduled_date ASC
      `;
      params = [userId];
    }
    
    const [rows]: any = await pool.execute(query, params);
    return rows;
  }

  private static async sendStatusNotifications(application: any, newStatus: string): Promise<void> {
    // Get candidate and job information
    const [userRows]: any = await pool.execute(
      'SELECT email, first_name, last_name FROM users WHERE id = ?',
      [application.user_id]
    );
    
    const [jobRows]: any = await pool.execute(
      'SELECT title FROM jobs WHERE id = ?',
      [application.job_id]
    );
    
    if (userRows.length > 0 && jobRows.length > 0) {
      const user = userRows[0];
      const job = jobRows[0];
      
      // Send email notification
      await EmailService.sendApplicationStatusUpdate(
        user.email,
        {
          candidateName: `${user.first_name} ${user.last_name}`,
          jobTitle: job.title,
          newStatus: newStatus,
          statusMessage: `Your application status has been updated to ${newStatus}`,
          applicationId: application.id
        }
      );
      
      // Send in-app notification
      await NotificationService.createNotification(
        application.user_id,
        'application_status_update',
        `Your application status for ${job.title} has been updated to ${newStatus}`,
        `/applications/${application.id}`
      );
    }
  }

  private static async sendInterviewNotifications(data: ApplicationWorkflowData, interviewId: number): Promise<void> {
    // Get candidate information
    const [userRows]: any = await pool.execute(
      'SELECT email, first_name, last_name FROM users WHERE id = ?',
      [data.candidateId]
    );
    
    const [jobRows]: any = await pool.execute(
      'SELECT title FROM jobs WHERE id = ?',
      [data.jobId]
    );
    
    if (userRows.length > 0 && jobRows.length > 0) {
      const user = userRows[0];
      const job = jobRows[0];
      
      // Send interview invitation email
      await EmailService.sendInterviewInvitation(
        user.email,
        {
          candidateName: `${user.first_name} ${user.last_name}`,
          jobTitle: job.title,
          interviewType: data.interviewType,
          interviewLocation: data.location || '',
          interviewerName: 'Hiring Manager',
          scheduledDate: data.scheduledDate,
          location: data.location,
          meetingLink: data.meetingLink,
          interviewId: interviewId
        }
      );
      
      // Send in-app notification
      await NotificationService.createNotification(
        data.candidateId,
        'interview_scheduled',
        `Interview scheduled for ${job.title} on ${data.scheduledDate}`,
        `/interviews/${interviewId}`
      );
    }
  }

  private static async sendOfferNotification(applicationId: number, offerDetails: any): Promise<void> {
    // Get application and user data
    const [applicationRows]: any = await pool.execute(
      'SELECT user_id, job_id FROM applications WHERE id = ?',
      [applicationId]
    );
    
    if (applicationRows.length > 0) {
      const application = applicationRows[0];
      
      const [userRows]: any = await pool.execute(
        'SELECT email, first_name, last_name FROM users WHERE id = ?',
        [application.user_id]
      );
      
      const [jobRows]: any = await pool.execute(
        'SELECT title FROM jobs WHERE id = ?',
        [application.job_id]
      );
      
      if (userRows.length > 0 && jobRows.length > 0) {
        const user = userRows[0];
        const job = jobRows[0];
        
        await EmailService.sendJobOffer(
          user.email,
          {
            candidateName: `${user.first_name} ${user.last_name}`,
            jobTitle: job.title,
            companyName: 'Career Portal',
            offerDetails: '',
            salary: offerDetails.salary,
            startDate: offerDetails.startDate,
            benefits: offerDetails.benefits,
            conditions: offerDetails.conditions
          }
        );
      }
    }
  }
}
