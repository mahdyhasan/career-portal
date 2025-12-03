import { Response } from 'express';
import { SkillsAssessmentService } from '../services/skillsAssessmentService';
import { authenticateToken, requireAnyRole, AuthRequest } from '../middleware/auth';
import pool from '../config/database';

export const handleCreateAssessment = [
  authenticateToken,
  requireAnyRole(['SuperAdmin', 'HiringManager']),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const assessmentData = {
        ...req.body,
        createdBy: userId
      };

      const assessmentId = await SkillsAssessmentService.createAssessment(assessmentData);

      res.json({ 
        success: true, 
        assessmentId,
        message: 'Assessment created successfully' 
      });
    } catch (error) {
      console.error('Error creating assessment:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleAddQuestion = [
  authenticateToken,
  requireAnyRole(['SuperAdmin', 'HiringManager']),
  async (req: AuthRequest, res: Response) => {
    try {
      const questionData = req.body;

      const questionId = await SkillsAssessmentService.addQuestion(questionData);

      res.json({ 
        success: true, 
        questionId,
        message: 'Question added successfully' 
      });
    } catch (error) {
      console.error('Error adding question:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleStartAssessment = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { assessmentId } = req.body;

      const result = await SkillsAssessmentService.startAssessment(userId, assessmentId);

      res.json({ 
        success: true, 
        ...result 
      });
    } catch (error) {
      console.error('Error starting assessment:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleSubmitAssessment = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const { attemptId, answers } = req.body;

      const result = await SkillsAssessmentService.submitAssessment(
        attemptId,
        userId,
        answers
      );

      res.json({ 
        success: true, 
        result 
      });
    } catch (error) {
      console.error('Error submitting assessment:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleGetAssessmentResults = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const assessmentId = req.query.assessmentId ? parseInt(req.query.assessmentId as string) : undefined;

      const results = await SkillsAssessmentService.getAssessmentResults(userId, assessmentId);

      res.json({ 
        success: true, 
        results 
      });
    } catch (error) {
      console.error('Error getting assessment results:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleGetAvailableAssessments = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user.id;
      const category = req.query.category as string;

      const assessments = await SkillsAssessmentService.getAvailableAssessments(userId, category);

      res.json({ 
        success: true, 
        assessments 
      });
    } catch (error) {
      console.error('Error getting available assessments:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleGetAssessmentDetails = [
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { assessmentId } = req.params;

      // This would typically get assessment details including questions
      // For security reasons, we might want to limit what information is returned
      // before the assessment is actually started
      
      const [assessmentRows]: any = await pool.execute(
        `SELECT 
          a.*,
          u.first_name,
          u.last_name
        FROM assessments a
        JOIN users u ON a.created_by = u.id
        WHERE a.id = ?`,
        [assessmentId]
      );

      if (assessmentRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Assessment not found'
        });
      }

      const assessment = assessmentRows[0];

      res.json({ 
        success: true, 
        assessment: {
          id: assessment.id,
          title: assessment.title,
          description: assessment.description,
          category: assessment.category,
          difficulty: assessment.difficulty,
          duration: assessment.duration,
          passingScore: assessment.passing_score,
          totalQuestions: assessment.total_questions,
          createdByName: `${assessment.first_name} ${assessment.last_name}`,
          createdAt: assessment.created_at,
          updatedAt: assessment.updated_at
        }
      });
    } catch (error) {
      console.error('Error getting assessment details:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];
