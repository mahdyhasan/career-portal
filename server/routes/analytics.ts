import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { authenticateToken } from '../middleware/auth';

export const handleGetSystemAnalytics = [
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const analytics = await AnalyticsService.getSystemAnalytics();
      
      res.json({ 
        success: true, 
        analytics 
      });
    } catch (error) {
      console.error('Error getting system analytics:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleGetJobAnalytics = [
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const analytics = await AnalyticsService.getJobAnalytics(parseInt(jobId));
      
      res.json({ 
        success: true, 
        analytics 
      });
    } catch (error) {
      console.error('Error getting job analytics:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleGetUserAnalytics = [
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const analytics = await AnalyticsService.getUserAnalytics(parseInt(userId));
      
      res.json({ 
        success: true, 
        analytics 
      });
    } catch (error) {
      console.error('Error getting user analytics:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleGetDashboardStats = [
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const stats = await AnalyticsService.getDashboardStats();
      
      res.json({ 
        success: true, 
        stats 
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleExportAnalytics = [
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { type, format } = req.query;
      
      let data;
      switch (type) {
        case 'system':
          data = await AnalyticsService.getSystemAnalytics();
          break;
        case 'dashboard':
          data = await AnalyticsService.getDashboardStats();
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid export type'
          });
      }

      if (format === 'csv') {
        const csv = convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics_${Date.now()}.csv`);
        res.send(csv);
      } else {
        res.json({
          success: true,
          data
        });
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

function convertToCSV(data: any): string {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const flattenObject = (obj: any, prefix = ''): any => {
    return Object.keys(obj).reduce((acc: any, key: string) => {
      const pre = prefix.length ? prefix + '.' : '';
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(acc, flattenObject(obj[key], pre + key));
      } else {
        acc[pre + key] = obj[key];
      }
      return acc;
    }, {});
  };

  const flattened = flattenObject(data);
  const headers = Object.keys(flattened);
  const values = Object.values(flattened);

  return [headers.join(','), values.join(',')].join('\n');
}