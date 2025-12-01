// server/routes/candidate.ts
import { RequestHandler } from "express";
import { executeQuery, executeSingleQuery } from "../config/database";
import { AuthRequest } from "../middleware/auth";

// Get candidate profile
export const handleGetProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const role = (req as AuthRequest).user?.role;

    console.log('Candidate Route Debug - User:', (req as AuthRequest).user);
    console.log('Candidate Route Debug - Role:', role);
    console.log('Candidate Route Debug - Role Name:', role?.name);

    if (!userId || role?.name !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    // Get candidate profile with related data
    const result = await executeQuery(`
      SELECT 
        c.id,
        c.user_id,
        c.first_name,
        c.last_name,
        c.phone,
        c.bio,
        c.earliest_join_date,
        c.country_id,
        c.city_id,
        c.area_id,
        c.linkedin_url,
        c.github_url,
        c.portfolio_url,
        c.blog_url,
        c.created_at,
        c.updated_at,
        u.email,
        u.created_at as user_created_at,
        co.name as country_name,
        ci.name as city_name,
        a.name as area_name
      FROM candidate_profiles c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN countries co ON c.country_id = co.id
      LEFT JOIN cities ci ON c.city_id = ci.id
      LEFT JOIN areas a ON c.area_id = a.id
      WHERE c.user_id = ?
    `, [userId]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const candidate = result[0];

    // Get candidate skills
    const skillsResult = await executeQuery(`
      SELECT cs.id, s.name, s.id as skill_id
      FROM candidate_skills cs
      JOIN skills s ON cs.skill_id = s.id
      WHERE cs.candidate_profile_id = ?
    `, [candidate.id]);

    // Get candidate education
    const educationResult = await executeQuery(`
      SELECT id, degree, major_subject, institute_name, graduation_year, result
      FROM candidate_education
      WHERE candidate_profile_id = ?
      ORDER BY graduation_year DESC
    `, [candidate.id]);

    // Get candidate achievements
    const achievementsResult = await executeQuery(`
      SELECT id, achievement_type_id, title, description, issue_date, url
      FROM candidate_achievements
      WHERE candidate_profile_id = ?
      ORDER BY issue_date DESC
    `, [candidate.id]);

    // Get candidate attachments
    const attachmentsResult = await executeQuery(`
      SELECT id, file_type, file_url, file_size_kb, mime_type
      FROM candidate_attachments
      WHERE candidate_profile_id = ?
    `, [candidate.id]);

    const profileData = {
      id: candidate.id,
      user_id: candidate.user_id,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      phone: candidate.phone,
      bio: candidate.bio,
      earliest_join_date: candidate.earliest_join_date,
      country_id: candidate.country_id,
      city_id: candidate.city_id,
      area_id: candidate.area_id,
      linkedin_url: candidate.linkedin_url,
      github_url: candidate.github_url,
      portfolio_url: candidate.portfolio_url,
      blog_url: candidate.blog_url,
      created_at: candidate.created_at,
      updated_at: candidate.updated_at,
      user: {
        email: candidate.email,
        created_at: candidate.user_created_at
      },
      country: candidate.country_name ? {
        id: candidate.country_id,
        name: candidate.country_name
      } : null,
      city: candidate.city_name ? {
        id: candidate.city_id,
        name: candidate.city_name
      } : null,
      area: candidate.area_name ? {
        id: candidate.area_id,
        name: candidate.area_name
      } : null,
      skills: skillsResult.map(skill => ({
        id: skill.id,
        skill_id: skill.skill_id,
        skill: {
          id: skill.skill_id,
          name: skill.name
        }
      })),
      education: educationResult,
      achievements: achievementsResult,
      attachments: attachmentsResult
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Update candidate profile
export const handleUpdateProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const role = (req as AuthRequest).user?.role;
    const { 
      first_name, 
      last_name, 
      phone, 
      bio, 
      earliest_join_date, 
      country_id, 
      city_id, 
      area_id, 
      linkedin_url, 
      github_url, 
      portfolio_url, 
      blog_url 
    } = req.body || {};

    if (!userId || role?.name !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    // First get candidate_id from user_id
    const candidateResult = await executeQuery(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }

    const candidateId = candidateResult[0].id;

    // Update candidate profile
    // Validate and format the earliest_join_date
    let formattedEarliestJoinDate = earliest_join_date;
    if (earliest_join_date) {
      // Try to parse the date and format it properly
      try {
        const date = new Date(earliest_join_date);
        if (!isNaN(date.getTime())) {
          formattedEarliestJoinDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        }
      } catch (e) {
        console.warn('Invalid date format for earliest_join_date:', earliest_join_date);
        formattedEarliestJoinDate = null; // Set to null if invalid
      }
    }

    await executeQuery(`
      UPDATE candidate_profiles 
      SET first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          bio = COALESCE(?, bio),
          earliest_join_date = COALESCE(?, earliest_join_date),
          country_id = COALESCE(?, country_id),
          city_id = COALESCE(?, city_id),
          area_id = COALESCE(?, area_id),
          linkedin_url = COALESCE(?, linkedin_url),
          github_url = COALESCE(?, github_url),
          portfolio_url = COALESCE(?, portfolio_url),
          blog_url = COALESCE(?, blog_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [
      first_name, 
      last_name, 
      phone, 
      bio, 
      formattedEarliestJoinDate, 
      country_id, 
      city_id, 
      area_id, 
      linkedin_url, 
      github_url, 
      portfolio_url, 
      blog_url, 
      userId
    ]);

    // Get updated profile data
    const profileResult = await executeQuery(`
      SELECT 
        c.id,
        c.user_id,
        c.first_name,
        c.last_name,
        c.phone,
        c.bio,
        c.earliest_join_date,
        c.country_id,
        c.city_id,
        c.area_id,
        c.linkedin_url,
        c.github_url,
        c.portfolio_url,
        c.blog_url,
        c.created_at,
        c.updated_at,
        u.email,
        u.created_at as user_created_at,
        co.name as country_name,
        ci.name as city_name,
        a.name as area_name
      FROM candidate_profiles c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN countries co ON c.country_id = co.id
      LEFT JOIN cities ci ON c.city_id = ci.id
      LEFT JOIN areas a ON c.area_id = a.id
      WHERE c.id = ?
    `, [candidateId]);

    // Get candidate skills
    const skillsResult = await executeQuery(`
      SELECT cs.id, s.name, s.id as skill_id
      FROM candidate_skills cs
      JOIN skills s ON cs.skill_id = s.id
      WHERE cs.candidate_profile_id = ?
    `, [candidateId]);

    const profileData = {
      id: profileResult[0].id,
      user_id: profileResult[0].user_id,
      first_name: profileResult[0].first_name,
      last_name: profileResult[0].last_name,
      phone: profileResult[0].phone,
      bio: profileResult[0].bio,
      earliest_join_date: profileResult[0].earliest_join_date,
      country_id: profileResult[0].country_id,
      city_id: profileResult[0].city_id,
      area_id: profileResult[0].area_id,
      linkedin_url: profileResult[0].linkedin_url,
      github_url: profileResult[0].github_url,
      portfolio_url: profileResult[0].portfolio_url,
      blog_url: profileResult[0].blog_url,
      created_at: profileResult[0].created_at,
      updated_at: profileResult[0].updated_at,
      user: {
        email: profileResult[0].email,
        created_at: profileResult[0].user_created_at
      },
      country: profileResult[0].country_name ? {
        id: profileResult[0].country_id,
        name: profileResult[0].country_name
      } : null,
      city: profileResult[0].city_name ? {
        id: profileResult[0].city_id,
        name: profileResult[0].city_name
      } : null,
      area: profileResult[0].area_name ? {
        id: profileResult[0].area_id,
        name: profileResult[0].area_name
      } : null,
      skills: skillsResult.map(skill => ({
        id: skill.id,
        skill_id: skill.skill_id,
        skill: {
          id: skill.skill_id,
          name: skill.name
        }
      }))
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error updating candidate profile:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Add skill to candidate profile
export const handleAddSkill: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const role = (req as AuthRequest).user?.role;
    const { skill_id, custom_skill_name } = req.body;

    if (!userId || role?.name !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    // Get candidate_id
    const candidateResult = await executeQuery(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }

    const candidateId = candidateResult[0].id;

    let finalSkillId = skill_id;

    // If custom skill name is provided, create or find the skill
    if (custom_skill_name) {
      // Check if skill already exists
      const existingSkill = await executeQuery(`
        SELECT id FROM skills WHERE LOWER(name) = LOWER(?) LIMIT 1
      `, [custom_skill_name.trim()]);

      if (existingSkill.length > 0) {
        finalSkillId = existingSkill[0].id;
      } else {
        // Create new skill
        const newSkill = await executeSingleQuery(`
          INSERT INTO skills (name, is_approved) VALUES (?, ?)
        `, [custom_skill_name.trim(), false]);
        
        finalSkillId = newSkill.insertId;
      }
    }

    // Check if skill is already added to candidate
    const existingCandidateSkill = await executeQuery(`
      SELECT id FROM candidate_skills WHERE candidate_profile_id = ? AND skill_id = ?
    `, [candidateId, finalSkillId]);

    if (existingCandidateSkill.length > 0) {
      return res.status(400).json({ message: 'Skill already added to profile' });
    }

    // Add skill to candidate profile
    await executeQuery(`
      INSERT INTO candidate_skills (candidate_profile_id, skill_id)
      VALUES (?, ?)
    `, [candidateId, finalSkillId]);

    res.json({ message: 'Skill added successfully' });
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Remove skill from candidate profile
export const handleRemoveSkill: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const role = (req as AuthRequest).user?.role;
    const skillId = parseInt(req.params.skillId);

    if (!userId || role?.name !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    if (isNaN(skillId)) {
      return res.status(400).json({ message: 'Invalid skill ID' });
    }

    // Get candidate_id
    const candidateResult = await executeQuery(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }

    const candidateId = candidateResult[0].id;

    // Remove skill from candidate profile
    const result = await executeQuery(`
      DELETE FROM candidate_skills WHERE candidate_profile_id = ? AND skill_id = ?
    `, [candidateId, skillId]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Skill not found in profile' });
    }

    res.json({ message: 'Skill removed successfully' });
  } catch (error) {
    console.error('Error removing skill:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Withdraw application
export const handleWithdrawApplication: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const role = (req as AuthRequest).user?.role;
    const applicationId = parseInt(req.params.applicationId);

    if (!userId || role?.name !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    if (isNaN(applicationId)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    // Check if application belongs to candidate
    const applicationResult = await executeQuery(`
      SELECT id, status_id FROM applications WHERE id = ? AND candidate_user_id = ?
    `, [applicationId, userId]);

    if (applicationResult.length === 0) {
      return res.status(404).json({ message: 'Application not found or access denied' });
    }

    const previousStatusId = applicationResult[0].status_id;

    // Get 'Withdrawn' status ID
    const withdrawnStatusResult = await executeQuery(`
      SELECT id FROM application_statuses WHERE name = 'Withdrawn' LIMIT 1
    `);

    let withdrawnStatusId;
    if (withdrawnStatusResult.length === 0) {
      // Create withdrawn status if it doesn't exist
      const newStatus = await executeSingleQuery(`
        INSERT INTO application_statuses (name) VALUES ('Withdrawn')
      `);
      withdrawnStatusId = newStatus.insertId;
    } else {
      withdrawnStatusId = withdrawnStatusResult[0].id;
    }

    // Update application status
    await executeQuery(`
      UPDATE applications 
      SET status_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [withdrawnStatusId, applicationId]);

    // Add to history
    await executeQuery(`
      INSERT INTO application_history (application_id, previous_status_id, new_status_id, changed_by_user_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [applicationId, previousStatusId, withdrawnStatusId, userId, 'Application withdrawn by candidate']);

    res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Add education to candidate profile
export const handleAddEducation: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const role = (req as AuthRequest).user?.role;
    const { institute_name, degree, major_subject, graduation_year, result } = req.body;

    if (!userId || role?.name !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    // Get candidate_id
    const candidateResult = await executeQuery(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }

    const candidateId = candidateResult[0].id;

    // Add education to candidate profile
    const insertResult = await executeSingleQuery(`
      INSERT INTO candidate_education (candidate_profile_id, institute_name, degree, major_subject, graduation_year, result)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [candidateId, institute_name, degree, major_subject, graduation_year || null, result || null]);

    res.json({ 
      id: insertResult.insertId,
      message: 'Education added successfully' 
    });
  } catch (error) {
    console.error('Error adding education:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Update education in candidate profile
export const handleUpdateEducation: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const role = (req as AuthRequest).user?.role;
    const educationId = parseInt(req.params.id);
    const { institute_name, degree, major_subject, graduation_year, result } = req.body;

    if (!userId || role?.name !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    if (isNaN(educationId)) {
      return res.status(400).json({ message: 'Invalid education ID' });
    }

    // Get candidate_id and verify ownership
    const candidateResult = await executeQuery(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }

    const candidateId = candidateResult[0].id;

    // Check if education belongs to candidate
    const educationCheckResult = await executeQuery(`
      SELECT id FROM candidate_education WHERE id = ? AND candidate_profile_id = ?
    `, [educationId, candidateId]);

    if (educationCheckResult.length === 0) {
      return res.status(404).json({ message: 'Education not found' });
    }

    // Update education
    await executeQuery(`
      UPDATE candidate_education 
      SET institute_name = ?, degree = ?, major_subject = ?, graduation_year = ?, result = ?
      WHERE id = ?
    `, [institute_name, degree, major_subject, graduation_year || null, result || null, educationId]);

    res.json({ message: 'Education updated successfully' });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Delete education from candidate profile
export const handleDeleteEducation: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const role = (req as AuthRequest).user?.role;
    const educationId = parseInt(req.params.id);

    if (!userId || role?.name !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    if (isNaN(educationId)) {
      return res.status(400).json({ message: 'Invalid education ID' });
    }

    // Get candidate_id and verify ownership
    const candidateResult = await executeQuery(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }

    const candidateId = candidateResult[0].id;

    // Check if education belongs to candidate
    const educationCheckResult = await executeQuery(`
      SELECT id FROM candidate_education WHERE id = ? AND candidate_profile_id = ?
    `, [educationId, candidateId]);

    if (educationCheckResult.length === 0) {
      return res.status(404).json({ message: 'Education not found' });
    }

    // Delete education
    const result = await executeQuery(`
      DELETE FROM candidate_education WHERE id = ?
    `, [educationId]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Education not found' });
    }

    res.json({ message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Add achievement to candidate profile
export const handleAddAchievement: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const role = (req as AuthRequest).user?.role;
    const { achievement_type_id, title, description, issue_date, url } = req.body;

    if (!userId || role?.name !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    // Get candidate_id
    const candidateResult = await executeQuery(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }

    const candidateId = candidateResult[0].id;

    // Add achievement to candidate profile
    const insertResult = await executeSingleQuery(`
      INSERT INTO candidate_achievements (candidate_profile_id, achievement_type_id, title, description, issue_date, url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [candidateId, achievement_type_id, title, description, issue_date || null, url || null]);

    res.status(201).json({ 
      id: insertResult.insertId,
      message: 'Achievement added successfully' 
    });
  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Update achievement in candidate profile
export const handleUpdateAchievement: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const role = (req as AuthRequest).user?.role;
    const achievementId = parseInt(req.params.id);
    const { achievement_type_id, title, description, issue_date, url } = req.body;

    if (!userId || role?.name !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    if (isNaN(achievementId)) {
      return res.status(400).json({ message: 'Invalid achievement ID' });
    }

    // Get candidate_id and verify ownership
    const candidateResult = await executeQuery(`
      SELECT cp.id FROM candidate_profiles cp
      JOIN candidate_achievements ca ON cp.id = ca.candidate_profile_id
      WHERE ca.id = ? AND cp.user_id = ?
    `, [achievementId, userId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ message: 'Achievement not found or access denied' });
    }

    const candidateId = candidateResult[0].id;

    // Update achievement
    await executeQuery(`
      UPDATE candidate_achievements 
      SET achievement_type_id = ?, title = ?, description = ?, issue_date = ?, url = ?
      WHERE id = ?
    `, [achievement_type_id, title, description, issue_date || null, url || null, achievementId]);

    res.json({ message: 'Achievement updated successfully' });
  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Delete achievement from candidate profile
export const handleDeleteAchievement: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const role = (req as AuthRequest).user?.role;
    const achievementId = parseInt(req.params.id);

    if (!userId || role?.name !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    if (isNaN(achievementId)) {
      return res.status(400).json({ message: 'Invalid achievement ID' });
    }

    // Get candidate_id and verify ownership
    const candidateResult = await executeQuery(`
      SELECT cp.id FROM candidate_profiles cp
      JOIN candidate_achievements ca ON cp.id = ca.candidate_profile_id
      WHERE ca.id = ? AND cp.user_id = ?
    `, [achievementId, userId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ message: 'Achievement not found or Access denied' });
    }

    const candidateId = candidateResult[0].id;

    // Delete achievement
    const result = await executeQuery(`
      DELETE FROM candidate_achievements WHERE id = ?
    `, [achievementId]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Handle file upload
export const handleUploadFile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).user?.id;
    const role = (req as AuthRequest).user?.role;

    if (!userId || role?.name !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    // Get candidate_id
    const candidateResult = await executeQuery(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }

    const candidateId = candidateResult[0].id;

    // This is a placeholder - in a real implementation, you'd handle file upload
    // For now, we'll just return a success response
    const { file_type } = req.body;
    
    // For demo purposes, we'll just store a mock file URL
    const mockFileUrl = `https://example.com/files/${Date.now()}-${file_type}`;
    
    await executeQuery(`
      INSERT INTO candidate_attachments (candidate_profile_id, file_type, file_url, file_size_kb, mime_type)
      VALUES (?, ?, ?, ?, ?)
    `, [candidateId, file_type, mockFileUrl, 100, 'application/pdf']);

    const result = {
      id: Date.now(), // Mock ID
      file_type,
      file_url: mockFileUrl,
      file_size_kb: 100,
      mime_type: 'application/pdf'
    };

    res.json(result);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
