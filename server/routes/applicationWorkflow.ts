import { Response } from 'express';
import { ApplicationWorkflowService } from '../services/applicationWorkflowService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

export const handleUpdateApplicationStatus = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { applicationId } = req.params;
      const { status, notes } = req.body;
      const userId = req.user.id;

      await ApplicationWorkflowService.updateApplicationStatus(
        parseInt(applicationId),
        status,
        userId,
        notes
      );

      res.json({ 
        success: true, 
        message: 'Application status updated successfully' 
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleScheduleInterview = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const {
        applicationId,
        interviewType,
        scheduledDate,
        location,
        meetingLink,
        interviewers,
        notes
      } = req.body;

      const interviewId = await ApplicationWorkflowService.scheduleInterview({
        applicationId,
        candidateId: 0, // Will be fetched from application
        jobId: 0, // Will be fetched from application
        hiringManagerId: userId,
        currentStatus: 'interview_scheduled',
        nextAction: 'schedule_interview',
        scheduledDate: new Date(scheduledDate),
        notes,
        interviewType,
        interviewers,
        location,
        meetingLink
      });

      res.json({ 
        success: true, 
        interviewId,
        message: 'Interview scheduled successfully' 
      });
    } catch (error) {
      console.error('Error scheduling interview:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleUpdateInterviewStatus = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { interviewId } = req.params;
      const { status, notes } = req.body;
      const userId = req.user.id;

      await ApplicationWorkflowService.updateInterviewStatus(
        parseInt(interviewId),
        status,
        notes,
        userId
      );

      res.json({ 
        success: true, 
        message: 'Interview status updated successfully' 
      });
    } catch (error) {
      console.error('Error updating interview status:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleMakeJobOffer = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const {
        applicationId,
        salary,
        startDate,
        benefits,
        conditions
      } = req.body;

      const offerId = await ApplicationWorkflowService.makeJobOffer(
        applicationId,
        {
          salary,
          startDate: new Date(startDate),
          benefits,
          conditions
        },
        userId
      );

      res.json({ 
        success: true, 
        offerId,
        message: 'Job offer created successfully' 
      });
    } catch (error) {
      console.error('Error making job offer:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleRespondToOffer = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { offerId } = req.params;
      const { response, notes } = req.body;

      await ApplicationWorkflowService.respondToOffer(
        parseInt(offerId),
        response,
        userId,
        notes
      );

      res.json({ 
        success: true, 
        message: 'Offer response recorded successfully' 
      });
    } catch (error) {
      console.error('Error responding to offer:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleGetApplicationWorkflowHistory = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { applicationId } = req.params;

      const history = await ApplicationWorkflowService.getApplicationWorkflowHistory(
        parseInt(applicationId)
      );

      res.json({ 
        success: true, 
        history 
      });
    } catch (error) {
      console.error('Error getting workflow history:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleGetUpcomingInterviews = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      const interviews = await ApplicationWorkflowService.getUpcomingInterviews(
        userId,
        userRole.name
      );

      res.json({ 
        success: true, 
        interviews 
      });
    } catch (error) {
      console.error('Error getting upcoming interviews:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];
