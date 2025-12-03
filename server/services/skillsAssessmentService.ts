import pool from '../config/database';
import { EmailService } from './emailService';

export interface Assessment {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  passingScore: number;
  totalQuestions: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: number;
  assessmentId: number;
  question: string;
  questionType: 'multiple_choice' | 'single_choice' | 'true_false' | 'coding';
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
  codeTemplate?: string;
  testCases?: any[];
}

export interface AssessmentAttempt {
  id: number;
  userId: number;
  assessmentId: number;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  passed?: boolean;
  answers: any[];
  timeSpent: number;
}

export class SkillsAssessmentService {
  
  static async createAssessment(assessmentData: {
    title: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    passingScore: number;
    createdBy: number;
  }): Promise<number> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [result]: any = await connection.execute(
        `INSERT INTO assessments (
          title, description, category, difficulty, duration, 
          passing_score, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          assessmentData.title,
          assessmentData.description,
          assessmentData.category,
          assessmentData.difficulty,
          assessmentData.duration,
          assessmentData.passingScore,
          assessmentData.createdBy
        ]
      );
      
      const assessmentId = result.insertId;
      
      await connection.commit();
      return assessmentId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async addQuestion(questionData: {
    assessmentId: number;
    question: string;
    questionType: 'multiple_choice' | 'single_choice' | 'true_false' | 'coding';
    options?: string[];
    correctAnswer: string | string[];
    points: number;
    explanation?: string;
    codeTemplate?: string;
    testCases?: any[];
  }): Promise<number> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const [result]: any = await connection.execute(
        `INSERT INTO assessment_questions (
          assessment_id, question, question_type, options, correct_answer,
          points, explanation, code_template, test_cases
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          questionData.assessmentId,
          questionData.question,
          questionData.questionType,
          JSON.stringify(questionData.options || []),
          JSON.stringify(questionData.correctAnswer),
          questionData.points,
          questionData.explanation || '',
          questionData.codeTemplate || '',
          JSON.stringify(questionData.testCases || [])
        ]
      );
      
      // Update assessment total questions count
      await connection.execute(
        'UPDATE assessments SET total_questions = total_questions + 1 WHERE id = ?',
        [questionData.assessmentId]
      );
      
      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async startAssessment(userId: number, assessmentId: number): Promise<{
    attemptId: number;
    questions: Question[];
    duration: number;
  }> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if user has already attempted this assessment
      const [existingAttempts]: any = await connection.execute(
        'SELECT id FROM assessment_attempts WHERE user_id = ? AND assessment_id = ? AND completed_at IS NULL',
        [userId, assessmentId]
      );
      
      if (existingAttempts.length > 0) {
        throw new Error('Assessment already in progress');
      }
      
      // Create new attempt
      const [attemptResult]: any = await connection.execute(
        'INSERT INTO assessment_attempts (user_id, assessment_id, started_at) VALUES (?, ?, NOW())',
        [userId, assessmentId]
      );
      
      const attemptId = attemptResult.insertId;
      
      // Get assessment details and questions
      const [assessmentRows]: any = await connection.execute(
        'SELECT duration FROM assessments WHERE id = ?',
        [assessmentId]
      );
      
      if (assessmentRows.length === 0) {
        throw new Error('Assessment not found');
      }
      
      const duration = assessmentRows[0].duration;
      
      // Get questions for the assessment
      const [questionRows]: any = await connection.execute(
        'SELECT * FROM assessment_questions WHERE assessment_id = ? ORDER BY RAND()',
        [assessmentId]
      );
      
      const questions: Question[] = questionRows.map((row: any) => ({
        id: row.id,
        assessmentId: row.assessment_id,
        question: row.question,
        questionType: row.question_type,
        options: JSON.parse(row.options || '[]'),
        correctAnswer: JSON.parse(row.correct_answer),
        points: row.points,
        explanation: row.explanation,
        codeTemplate: row.code_template,
        testCases: JSON.parse(row.test_cases || '[]')
      }));
      
      await connection.commit();
      
      return {
        attemptId,
        questions,
        duration
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async submitAssessment(
    attemptId: number,
    userId: number,
    answers: Array<{
      questionId: number;
      answer: string | string[];
      timeSpent: number;
    }>
  ): Promise<{
    score: number;
    passed: boolean;
    totalPoints: number;
    correctAnswers: number;
    detailedResults: any[];
  }> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get attempt details
      const [attemptRows]: any = await connection.execute(
        'SELECT assessment_id FROM assessment_attempts WHERE id = ? AND user_id = ?',
        [attemptId, userId]
      );
      
      if (attemptRows.length === 0) {
        throw new Error('Assessment attempt not found');
      }
      
      const assessmentId = attemptRows[0].assessment_id;
      
      // Get assessment details
      const [assessmentRows]: any = await connection.execute(
        'SELECT passing_score FROM assessments WHERE id = ?',
        [assessmentId]
      );
      
      const passingScore = assessmentRows[0].passing_score;
      
      // Get all questions for the assessment
      const [questionRows]: any = await connection.execute(
        'SELECT id, correct_answer, points FROM assessment_questions WHERE assessment_id = ?',
        [assessmentId]
      );
      
      const questions = questionRows.map((row: any) => ({
        id: row.id,
        correctAnswer: JSON.parse(row.correct_answer),
        points: row.points
      }));
      
      // Calculate score
      let totalScore = 0;
      let totalPoints = 0;
      let correctAnswers = 0;
      const detailedResults: any[] = [];
      
      for (const question of questions) {
        const userAnswer = answers.find(a => a.questionId === question.id);
        const isCorrect = this.checkAnswer(userAnswer?.answer, question.correctAnswer);
        
        if (isCorrect) {
          totalScore += question.points;
          correctAnswers++;
        }
        
        totalPoints += question.points;
        
        detailedResults.push({
          questionId: question.id,
          correct: isCorrect,
          userAnswer: userAnswer?.answer,
          correctAnswer: question.correctAnswer,
          pointsEarned: isCorrect ? question.points : 0,
          maxPoints: question.points,
          timeSpent: userAnswer?.timeSpent || 0
        });
      }
      
      const percentageScore = Math.round((totalScore / totalPoints) * 100);
      const passed = percentageScore >= passingScore;
      
      // Update attempt record
      await connection.execute(
        `UPDATE assessment_attempts 
         SET completed_at = NOW(), 
             score = ?, 
             passed = ?, 
             answers = ?, 
             time_spent = ? 
         WHERE id = ?`,
        [
          percentageScore,
          passed,
          JSON.stringify(answers),
          answers.reduce((sum, a) => sum + a.timeSpent, 0),
          attemptId
        ]
      );
      
      // Update user skills if passed
      if (passed) {
        await this.updateUserSkills(userId, assessmentId);
      }
      
      // Send notification
      const [candidateRows]: any = await pool.execute(
        'SELECT email, first_name, last_name FROM users WHERE id = ?',
        [userId]
      );
      
      const candidateData = candidateRows[0];
      
      await EmailService.sendAssessmentResult(candidateData.email, {
        candidateName: `${candidateData.first_name} ${candidateData.last_name}`,
        assessmentType: 'Skills Assessment',
        score: percentageScore,
        result: passed ? 'Passed' : 'Failed',
        nextSteps: passed ? 
          'Congratulations! You have passed the assessment. Your profile will be updated accordingly.' :
          'Unfortunately, you did not meet the passing criteria. Please review the feedback and try again after improving your skills.'
      });
      
      await connection.commit();
      
      return {
        score: percentageScore,
        passed,
        totalPoints,
        correctAnswers,
        detailedResults
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getAssessmentResults(userId: number, assessmentId?: number): Promise<any[]> {
    let query: string;
    let params: any[];
    
    if (assessmentId) {
      query = `
        SELECT 
          aa.*,
          a.title,
          a.category,
          a.difficulty
        FROM assessment_attempts aa
        JOIN assessments a ON aa.assessment_id = a.id
        WHERE aa.user_id = ? AND aa.assessment_id = ? AND aa.completed_at IS NOT NULL
        ORDER BY aa.completed_at DESC
      `;
      params = [userId, assessmentId];
    } else {
      query = `
        SELECT 
          aa.*,
          a.title,
          a.category,
          a.difficulty
        FROM assessment_attempts aa
        JOIN assessments a ON aa.assessment_id = a.id
        WHERE aa.user_id = ? AND aa.completed_at IS NOT NULL
        ORDER BY aa.completed_at DESC
      `;
      params = [userId];
    }
    
    const [rows]: any = await pool.execute(query, params);
    
    return rows.map((row: any) => ({
      id: row.id,
      assessmentId: row.assessment_id,
      title: row.title,
      category: row.category,
      difficulty: row.difficulty,
      score: row.score,
      passed: row.passed,
      completedAt: row.completed_at,
      timeSpent: row.time_spent
    }));
  }

  static async getAvailableAssessments(userId: number, category?: string): Promise<Assessment[]> {
    let query: string;
    let params: any[];
    
    if (category) {
      query = `
        SELECT 
          a.*,
          u.first_name,
          u.last_name
        FROM assessments a
        JOIN users u ON a.created_by = u.id
        WHERE a.category = ? AND a.id NOT IN (
          SELECT assessment_id FROM assessment_attempts 
          WHERE user_id = ? AND passed = true
        )
      `;
      params = [category, userId];
    } else {
      query = `
        SELECT 
          a.*,
          u.first_name,
          u.last_name
        FROM assessments a
        JOIN users u ON a.created_by = u.id
        WHERE a.id NOT IN (
          SELECT assessment_id FROM assessment_attempts 
          WHERE user_id = ? AND passed = true
        )
      `;
      params = [userId];
    }
    
    const [rows]: any = await pool.execute(query, params);
    
    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      difficulty: row.difficulty,
      duration: row.duration,
      passingScore: row.passing_score,
      totalQuestions: row.total_questions,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdByName: `${row.first_name} ${row.last_name}`
    }));
  }

  private static checkAnswer(userAnswer: any, correctAnswer: any): boolean {
    if (!userAnswer) return false;
    
    if (Array.isArray(correctAnswer)) {
      if (Array.isArray(userAnswer)) {
        // For multiple choice questions
        return correctAnswer.length === userAnswer.length && 
               correctAnswer.every((val: any) => userAnswer.includes(val));
      } else {
        return correctAnswer.includes(userAnswer);
      }
    } else {
      return userAnswer.toString().toLowerCase() === correctAnswer.toString().toLowerCase();
    }
  }

  private static async updateUserSkills(userId: number, assessmentId: number): Promise<void> {
    // Get assessment category (which corresponds to a skill)
    const [assessmentRows]: any = await pool.execute(
      'SELECT category FROM assessments WHERE id = ?',
      [assessmentId]
    );
    
    if (assessmentRows.length === 0) return;
    
    const skillName = assessmentRows[0].category;
    
    // Check if skill exists
    const [skillRows]: any = await pool.execute(
      'SELECT id FROM skills WHERE name = ?',
      [skillName]
    );
    
    let skillId: number;
    
    if (skillRows.length === 0) {
      // Create new skill
      const [skillResult]: any = await pool.execute(
        'INSERT INTO skills (name) VALUES (?)',
        [skillName]
      );
      skillId = skillResult.insertId;
    } else {
      skillId = skillRows[0].id;
    }
    
    // Add skill to user if not already present
    const [userSkillRows]: any = await pool.execute(
      'SELECT id FROM user_skills WHERE user_id = ? AND skill_id = ?',
      [userId, skillId]
    );
    
    if (userSkillRows.length === 0) {
      await pool.execute(
        'INSERT INTO user_skills (user_id, skill_id) VALUES (?, ?)',
        [userId, skillId]
      );
    }
  }
}
