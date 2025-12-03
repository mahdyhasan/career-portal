// server/routes/candidate.ts
import { RequestHandler } from "express";
import { executeQuery, executeSingleQuery, findOne, transaction } from "../config/database";
import { AuthRequest } from "../middleware/auth";
import { 
  CandidateProfile, 
  CandidateEducation, 
  CandidateAchievement, 
  CandidateAttachment,
  CandidateSkill,
  Skill
} from '@shared/api';

// Get candidate profile
export const handleGetProfile: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get candidate profile with joined data
    const profileResult = await findOne<any>(`
      SELECT 
        c.id,
        c.user_id,
        c.full_name,
        c.phone,
        c.earliest_join_date,
        c.area_id,
        c.linkedin_url,
        c.github_url,
        c.portfolio_url,
        c.exp_salary_min,
        c.exp_salary_max,
        c.created_at,
        c.updated_at,
        u.email,
        a.name as area_name
      FROM candidate_profiles c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN system_areas a ON c.area_id = a.id
      WHERE c.user_id = ? AND c.deleted_at IS NULL
    `, [userId]);

    if (!profileResult) {
      return res.status(404).json({ 
        message: 'Profile not found',
        code: 'NOT_FOUND'
      });
    }

    const candidateId = profileResult.id;

    // Get skills with system_skills join
    const skillsResult = await executeQuery<CandidateSkill & { skill: Skill }>(`
      SELECT 
        cs.id,
        cs.candidate_profile_id,
        cs.skill_id,
        cs.proficiency,
        cs.years_experience,
        ss.name as skill_name,
        ss.is_approved
      FROM candidate_skills cs
      JOIN system_skills ss ON cs.skill_id = ss.id
      WHERE cs.candidate_profile_id = ?
    `, [candidateId]);

    // Get education (plural table name)
    const educationResult = await executeQuery<CandidateEducation>(`
      SELECT 
        id,
        institute_name,
        degree,
        major_subject,
        graduation_year,
        result
      FROM candidate_educations
      WHERE candidate_profile_id = ?
      ORDER BY graduation_year DESC
    `, [candidateId]);

    // Get achievements (no achievement_type_id in schema)
    const achievementsResult = await executeQuery<CandidateAchievement>(`
      SELECT 
        id,
        title,
        description,
        url,
        created_at
      FROM candidate_achievements
      WHERE candidate_profile_id = ?
      ORDER BY created_at DESC
    `, [candidateId]);

    // Get attachments (simplified schema)
    const attachmentsResult = await executeQuery<CandidateAttachment>(`
      SELECT 
        id,
        file_type,
        file_url,
        uploaded_at
      FROM candidate_attachments
      WHERE candidate_profile_id = ?
    `, [candidateId]);

    // Build complete profile object
    const profile: CandidateProfile = {
      id: candidateId,
      user_id: userId,
      full_name: profileResult.full_name,
      phone: profileResult.phone,
      earliest_join_date: profileResult.earliest_join_date,
      area_id: profileResult.area_id,
      linkedin_url: profileResult.linkedin_url,
      github_url: profileResult.github_url,
      portfolio_url: profileResult.portfolio_url,
      exp_salary_min: profileResult.exp_salary_min,
      exp_salary_max: profileResult.exp_salary_max,
      created_at: profileResult.created_at,
      updated_at: profileResult.updated_at,
      user: {
        id: userId,
        email: profileResult.email,
        role_id: 0,
        is_active: false,
        created_at: "",
        updated_at: ""
      },
      area: profileResult.area_name ? {
        id: profileResult.area_id,
        name: profileResult.area_name
      } : undefined,
      skills: skillsResult.map(skill => ({
        id: skill.id,
        candidate_profile_id: skill.candidate_profile_id,
        skill_id: skill.skill_id,
        proficiency: skill.proficiency,
        years_experience: skill.years_experience,
        skill: {
          id: skill.skill_id,
          name: skill.skill_name,
          is_approved: skill.is_approved
        }
      })),
      education: educationResult,
      achievements: achievementsResult,
      attachments: attachmentsResult
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update candidate profile
export const handleUpdateProfile: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const { 
      full_name, 
      phone, 
      earliest_join_date, 
      area_id, 
      linkedin_url, 
      github_url, 
      portfolio_url, 
      exp_salary_min, 
      exp_salary_max 
    } = req.body;

    // Validate profile exists
    const existingProfile = await findOne<{ id: number }>(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (!existingProfile) {
      return res.status(404).json({ 
        message: 'Profile not found',
        code: 'NOT_FOUND'
      });
    }

    // Update profile
    await executeQuery(`
      UPDATE candidate_profiles 
      SET full_name = COALESCE(?, full_name),
          phone = COALESCE(?, phone),
          earliest_join_date = COALESCE(?, earliest_join_date),
          area_id = COALESCE(?, area_id),
          linkedin_url = COALESCE(?, linkedin_url),
          github_url = COALESCE(?, github_url),
          portfolio_url = COALESCE(?, portfolio_url),
          exp_salary_min = COALESCE(?, exp_salary_min),
          exp_salary_max = COALESCE(?, exp_salary_max),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [
      full_name, phone, earliest_join_date, area_id, 
      linkedin_url, github_url, portfolio_url, 
      exp_salary_min, exp_salary_max, userId
    ]);

    // Fetch updated profile
    const updatedProfile = await findOne<any>(`
      SELECT 
        c.id,
        c.user_id,
        c.full_name,
        c.phone,
        c.earliest_join_date,
        c.area_id,
        c.linkedin_url,
        c.github_url,
        c.portfolio_url,
        c.exp_salary_min,
        c.exp_salary_max,
        c.created_at,
        c.updated_at,
        u.email,
        a.name as area_name
      FROM candidate_profiles c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN system_areas a ON c.area_id = a.id
      WHERE c.user_id = ?
    `, [userId]);

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Add skill to candidate profile
export const handleAddSkill: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const { skill_id, custom_skill_name, proficiency, years_experience } = req.body;

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Get candidate profile ID
    const profile = await findOne<{ id: number }>(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (!profile) {
      return res.status(404).json({ 
        message: 'Profile not found',
        code: 'NOT_FOUND'
      });
    }

    const candidateId = profile.id;
    let finalSkillId = skill_id;

    // Handle custom skill creation
    if (custom_skill_name) {
      const existingSkill = await findOne<Skill>(`
        SELECT id FROM system_skills WHERE LOWER(name) = LOWER(?) LIMIT 1
      `, [custom_skill_name.trim()]);

      if (existingSkill) {
        finalSkillId = existingSkill.id;
      } else {
        // Create new unapproved skill
        const result = await executeSingleQuery(`
          INSERT INTO system_skills (name, is_approved) VALUES (?, FALSE)
        `, [custom_skill_name.trim()]);
        
        finalSkillId = result.insertId;
      }
    }

    if (!finalSkillId) {
      return res.status(400).json({ 
        message: 'skill_id or custom_skill_name required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Check for duplicate skill
    const duplicate = await findOne<{ skill_id: number }>(`
      SELECT skill_id FROM candidate_skills 
      WHERE candidate_profile_id = ? AND skill_id = ?
    `, [candidateId, finalSkillId]);

    if (duplicate) {
      return res.status(409).json({ 
        message: 'Skill already exists in profile',
        code: 'DUPLICATE_SKILL'
      });
    }

    // Add skill
    await executeQuery(`
      INSERT INTO candidate_skills (candidate_profile_id, skill_id, proficiency, years_experience)
      VALUES (?, ?, ?, ?)
    `, [candidateId, finalSkillId, proficiency || 'beginner', years_experience || 0]);

    // Fetch added skill
    const addedSkill = await findOne<Skill>(`
      SELECT id, name, is_approved FROM system_skills WHERE id = ?
    `, [finalSkillId]);

    res.status(201).json({
      message: 'Skill added successfully',
      skill: {
        skill_id: finalSkillId,
        proficiency: proficiency || 'beginner',
        years_experience: years_experience || 0,
        skill: addedSkill
      }
    });
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Remove skill from candidate profile
export const handleRemoveSkill: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const skillId = parseInt(req.params.skillId);

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (isNaN(skillId)) {
      return res.status(400).json({ 
        message: 'Invalid skill ID',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get candidate profile ID
    const profile = await findOne<{ id: number }>(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (!profile) {
      return res.status(404).json({ 
        message: 'Profile not found',
        code: 'NOT_FOUND'
      });
    }

    const candidateId = profile.id;

    // Remove skill
    const result = await executeSingleQuery(`
      DELETE FROM candidate_skills 
      WHERE candidate_profile_id = ? AND skill_id = ?
    `, [candidateId, skillId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Skill not found in profile',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      message: 'Skill removed successfully'
    });
  } catch (error) {
    console.error('Error removing skill:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Add education to candidate profile
export const handleAddEducation: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const { institute_name, degree, major_subject, graduation_year, result } = req.body;

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Validate required fields
    if (!institute_name || !degree || !major_subject) {
      return res.status(400).json({ 
        message: 'institute_name, degree, and major_subject are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get candidate profile ID
    const profile = await findOne<{ id: number }>(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (!profile) {
      return res.status(404).json({ 
        message: 'Profile not found',
        code: 'NOT_FOUND'
      });
    }

    const candidateId = profile.id;

    // Add education
    const resultId = await executeSingleQuery(`
      INSERT INTO candidate_educations 
      (candidate_profile_id, institute_name, degree, major_subject, graduation_year, result)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      candidateId, 
      institute_name, 
      degree, 
      major_subject, 
      graduation_year || null, 
      result || null
    ]);

    res.status(201).json({
      message: 'Education added successfully',
      education: {
        id: resultId.insertId,
        candidate_profile_id: candidateId,
        institute_name,
        degree,
        major_subject,
        graduation_year,
        result
      }
    });
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update education in candidate profile
export const handleUpdateEducation: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const educationId = parseInt(req.params.id);

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (isNaN(educationId)) {
      return res.status(400).json({ 
        message: 'Invalid education ID',
        code: 'VALIDATION_ERROR'
      });
    }

    const { institute_name, degree, major_subject, graduation_year, result } = req.body;

    // Verify ownership
    const educationCheck = await findOne<{ candidate_profile_id: number }>(`
      SELECT ce.candidate_profile_id
      FROM candidate_educations ce
      JOIN candidate_profiles cp ON ce.candidate_profile_id = cp.id
      WHERE ce.id = ? AND cp.user_id = ?
    `, [educationId, userId]);

    if (!educationCheck) {
      return res.status(404).json({ 
        message: 'Education not found or access denied',
        code: 'NOT_FOUND'
      });
    }

    // Update education
    const updateResult = await executeSingleQuery(`
      UPDATE candidate_educations 
      SET institute_name = COALESCE(?, institute_name),
          degree = COALESCE(?, degree),
          major_subject = COALESCE(?, major_subject),
          graduation_year = COALESCE(?, graduation_year),
          result = COALESCE(?, result)
      WHERE id = ?
    `, [institute_name, degree, major_subject, graduation_year, result, educationId]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Education not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      message: 'Education updated successfully'
    });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete education from candidate profile
export const handleDeleteEducation: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const educationId = parseInt(req.params.id);

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (isNaN(educationId)) {
      return res.status(400).json({ 
        message: 'Invalid education ID',
        code: 'VALIDATION_ERROR'
      });
    }

    // Verify ownership
    const educationCheck = await findOne<{ candidate_profile_id: number }>(`
      SELECT ce.candidate_profile_id
      FROM candidate_educations ce
      JOIN candidate_profiles cp ON ce.candidate_profile_id = cp.id
      WHERE ce.id = ? AND cp.user_id = ?
    `, [educationId, userId]);

    if (!educationCheck) {
      return res.status(404).json({ 
        message: 'Education not found or access denied',
        code: 'NOT_FOUND'
      });
    }

    // Delete education
    const deleteResult = await executeSingleQuery(`
      DELETE FROM candidate_educations WHERE id = ?
    `, [educationId]);

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Education not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      message: 'Education deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Add achievement to candidate profile
export const handleAddAchievement: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const { title, description, url } = req.body;

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Validate required fields
    if (!title) {
      return res.status(400).json({ 
        message: 'title is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get candidate profile ID
    const profile = await findOne<{ id: number }>(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (!profile) {
      return res.status(404).json({ 
        message: 'Profile not found',
        code: 'NOT_FOUND'
      });
    }

    const candidateId = profile.id;

    // Add achievement (no achievement_type_id in schema)
    const resultId = await executeSingleQuery(`
      INSERT INTO candidate_achievements 
      (candidate_profile_id, title, description, url)
      VALUES (?, ?, ?, ?)
    `, [candidateId, title, description || null, url || null]);

    res.status(201).json({
      message: 'Achievement added successfully',
      achievement: {
        id: resultId.insertId,
        candidate_profile_id: candidateId,
        title,
        description,
        url,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update achievement in candidate profile
export const handleUpdateAchievement: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const achievementId = parseInt(req.params.id);

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (isNaN(achievementId)) {
      return res.status(400).json({ 
        message: 'Invalid achievement ID',
        code: 'VALIDATION_ERROR'
      });
    }

    const { title, description, url } = req.body;

    // Verify ownership
    const achievementCheck = await findOne<{ candidate_profile_id: number }>(`
      SELECT ca.candidate_profile_id
      FROM candidate_achievements ca
      JOIN candidate_profiles cp ON ca.candidate_profile_id = cp.id
      WHERE ca.id = ? AND cp.user_id = ?
    `, [achievementId, userId]);

    if (!achievementCheck) {
      return res.status(404).json({ 
        message: 'Achievement not found or access denied',
        code: 'NOT_FOUND'
      });
    }

    // Update achievement
    const updateResult = await executeSingleQuery(`
      UPDATE candidate_achievements 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          url = COALESCE(?, url)
      WHERE id = ?
    `, [title, description, url, achievementId]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Achievement not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      message: 'Achievement updated successfully'
    });
  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete achievement from candidate profile
export const handleDeleteAchievement: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const achievementId = parseInt(req.params.id);

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    if (isNaN(achievementId)) {
      return res.status(400).json({ 
        message: 'Invalid achievement ID',
        code: 'VALIDATION_ERROR'
      });
    }

    // Verify ownership
    const achievementCheck = await findOne<{ candidate_profile_id: number }>(`
      SELECT ca.candidate_profile_id
      FROM candidate_achievements ca
      JOIN candidate_profiles cp ON ca.candidate_profile_id = cp.id
      WHERE ca.id = ? AND cp.user_id = ?
    `, [achievementId, userId]);

    if (!achievementCheck) {
      return res.status(404).json({ 
        message: 'Achievement not found or access denied',
        code: 'NOT_FOUND'
      });
    }

    // Delete achievement
    const deleteResult = await executeSingleQuery(`
      DELETE FROM candidate_achievements WHERE id = ?
    `, [achievementId]);

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ 
        message: 'Achievement not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      message: 'Achievement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Handle file upload for candidate
export const handleUploadFile: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const role = authReq.user?.role?.name;
    const { file_type, file_url } = req.body;

    if (!userId || !role) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (role !== 'Candidate') {
      return res.status(403).json({ 
        message: 'Access denied. Candidate role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Validate required fields
    if (!file_type || !file_url) {
      return res.status(400).json({ 
        message: 'file_type and file_url are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate file_type enum
    const validFileTypes = ['CV', 'Portfolio', 'Certificate', 'Other'];
    if (!validFileTypes.includes(file_type)) {
      return res.status(400).json({ 
        message: `file_type must be one of: ${validFileTypes.join(', ')}`,
        code: 'VALIDATION_ERROR'
      });
    }

    // Get candidate profile ID
    const profile = await findOne<{ id: number }>(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (!profile) {
      return res.status(404).json({ 
        message: 'Profile not found',
        code: 'NOT_FOUND'
      });
    }

    // Store file (simplified schema - no file_size_kb or mime_type)
    const resultId = await executeSingleQuery(`
      INSERT INTO candidate_attachments 
      (candidate_profile_id, file_type, file_url, uploaded_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [profile.id, file_type, file_url]);

    res.status(201).json({
      message: 'File uploaded successfully',
      attachment: {
        id: resultId.insertId,
        candidate_profile_id: profile.id,
        file_type,
        file_url,
        uploaded_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Withdraw application (moved to applications.ts - duplicate removed)
