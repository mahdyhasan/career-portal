import { Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

export const handleGetNotifications = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const notifications = await NotificationService.getUserNotifications(userId, limit);
      const unreadCount = await NotificationService.getUnreadNotificationCount(userId);
      
      res.json({ 
        success: true, 
        notifications,
        unreadCount 
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleMarkNotificationAsRead = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      await NotificationService.markNotificationAsRead(
        parseInt(notificationId),
        userId
      );
      
      const unreadCount = await NotificationService.getUnreadNotificationCount(userId);
      
      res.json({ 
        success: true, 
        unreadCount,
        message: 'Notification marked as read' 
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleMarkAllNotificationsAsRead = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;

      await NotificationService.markAllNotificationsAsRead(userId);
      
      res.json({ 
        success: true, 
        message: 'All notifications marked as read' 
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleGetUnreadCount = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const unreadCount = await NotificationService.getUnreadNotificationCount(userId);
      
      res.json({ 
        success: true, 
        unreadCount 
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];
