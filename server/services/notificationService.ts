import pool from '../config/database';
import { Server } from 'socket.io';

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
  link?: string;
}

export class NotificationService {
  private static io: Server;

  static initialize(io: Server) {
    this.io = io;
  }

  static async createNotification(
    userId: number,
    type: string,
    message: string,
    link?: string,
    data?: any
  ): Promise<Notification> {
    const [result]: any = await pool.execute(
      'INSERT INTO notifications (user_id, type, message, link, data, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [userId, type, message, link || '', JSON.stringify(data || {})]
    );

    const notification: Notification = {
      id: result.insertId,
      userId,
      type,
      title: this.getNotificationTitle(type),
      message,
      data,
      isRead: false,
      createdAt: new Date(),
      link
    };

    // Send real-time notification
    this.io.to(`user_${userId}`).emit('new_notification', notification);

    return notification;
  }

  static async getUserNotifications(userId: number, limit: number = 50): Promise<Notification[]> {
    const [rows]: any = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: this.getNotificationTitle(row.type),
      message: row.message,
      data: JSON.parse(row.data || '{}'),
      isRead: row.is_read,
      createdAt: row.created_at,
      link: row.link
    }));
  }

  static async markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    await pool.execute(
      'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
  }

  static async markAllNotificationsAsRead(userId: number): Promise<void> {
    await pool.execute(
      'UPDATE notifications SET is_read = true WHERE user_id = ?',
      [userId]
    );
  }

  static async getUnreadNotificationCount(userId: number): Promise<number> {
    const [rows]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false',
      [userId]
    );

    return rows[0].count;
  }

  static async sendBulkNotifications(
    userIds: number[],
    type: string,
    message: string,
    link?: string,
    data?: any
  ): Promise<void> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const values = userIds.map(userId => 
        `(${userId}, '${type}', '${message}', '${link || ''}', '${JSON.stringify(data || {})}', NOW())`
      ).join(',');

      await connection.execute(
        `INSERT INTO notifications (user_id, type, message, link, data, created_at) VALUES ${values}`
      );

      await connection.commit();

      // Send real-time notifications
      userIds.forEach(userId => {
        const notification = {
          id: Date.now(), // Temporary ID for real-time
          userId,
          type,
          title: this.getNotificationTitle(type),
          message,
          data,
          isRead: false,
          createdAt: new Date(),
          link
        };
        this.io.to(`user_${userId}`).emit('new_notification', notification);
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private static getNotificationTitle(type: string): string {
    const titles: { [key: string]: string } = {
      'application_submitted': 'Application Submitted',
      'application_status_update': 'Application Status Updated',
      'interview_scheduled': 'Interview Scheduled',
      'interview_reminder': 'Interview Reminder',
      'job_posted': 'New Job Posted',
      'job_closed': 'Job Closed',
      'offer_made': 'Job Offer Received',
      'offer_response': 'Offer Response',
      'profile_update': 'Profile Update Required',
      'document_expired': 'Document Expired',
      'system_announcement': 'System Announcement',
      'message_received': 'New Message',
      'task_assigned': 'Task Assigned',
      'deadline_reminder': 'Deadline Reminder'
    };

    return titles[type] || 'Notification';
  }

  // Real-time notification handlers
  static handleUserConnection(socket: any, userId: number) {
    socket.join(`user_${userId}`);
    
    // Send initial unread count
    this.getUnreadNotificationCount(userId).then(count => {
      socket.emit('unread_count', count);
    });
  }

  static handleUserDisconnection(socket: any, userId: number) {
    socket.leave(`user_${userId}`);
  }
}
