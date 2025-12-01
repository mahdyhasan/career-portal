import { RequestHandler } from "express";
import { executeQuery } from "../config/database";

// Get candidate profile
export const handleGetProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    console.log('Candidate Route Debug - User:', (req as any).user);
    console.log('Candidate Route Debug - Role:', role);
    console.log('Candidate Route Debug - Role Name:', role?.name);

    if (role?.name !== 'Candidate') {
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
        c.created_at,
        c.updated_at,
        u.email,
        u.created_at as user_created_at
      FROM candidate_profiles c
      JOIN users u ON c.user_id = u.id
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
      created_at: candidate.created_at,
      updated_at: candidate.updated_at,
      user: {
        email: candidate.email,
        created_at: candidate.user_created_at
      },
      skills: skillsResult.map(skill => ({
        id: skill.id,
        skill: {
          id: skill.skill_id,
          name: skill.name
        }
      })),
      education: educationResult,
      attachments: attachmentsResult
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update candidate profile
export const handleUpdateProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const { first_name, last_name, phone, bio } = req.body || {};

    if (role !== 'Candidate') {
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
    await executeQuery(`
      UPDATE candidate_profiles 
      SET first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          bio = COALESCE(?, bio),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [first_name, last_name, phone, bio, userId]);

    // Get updated profile data
    const profileResult = await executeQuery(`
      SELECT 
        c.id,
        c.user_id,
        c.first_name,
        c.last_name,
        c.phone,
        c.bio,
        c.created_at,
        c.updated_at,
        u.email
      FROM candidate_profiles c
      JOIN users u ON c.user_id = u.id
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
      created_at: profileResult[0].created_at,
      updated_at: profileResult[0].updated_at,
      user: {
        email: profileResult[0].email
      },
      skills: skillsResult.map(skill => ({
        id: skill.id,
        skill: {
          id: skill.skill_id,
          name: skill.name
        }
      }))
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error updating candidate profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add skill to candidate profile
export const handleAddSkill: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const { skill_id, custom_skill_name } = req.body;

    if (role !== 'Candidate') {
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
        const newSkill = await executeQuery(`
          INSERT INTO skills (name, is_approved) VALUES (?, ?)
        `, [custom_skill_name.trim(), false]);
        
        finalSkillId = (newSkill as any).insertId;
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
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove skill from candidate profile
export const handleRemoveSkill: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const skillId = parseInt(req.params.skillId);

    if (role !== 'Candidate') {
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
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Withdraw application
export const handleWithdrawApplication: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const applicationId = parseInt(req.params.applicationId);

    if (role !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    if (isNaN(applicationId)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    // Check if application belongs to the candidate
    const applicationResult = await executeQuery(`
      SELECT id FROM applications WHERE id = ? AND candidate_user_id = ?
    `, [applicationId, userId]);

    if (applicationResult.length === 0) {
      return res.status(404).json({ message: 'Application not found or access denied' });
    }

    // Get 'Withdrawn' status ID
    const withdrawnStatusResult = await executeQuery(`
      SELECT id FROM application_statuses WHERE name = 'Withdrawn' LIMIT 1
    `);

    if (withdrawnStatusResult.length === 0) {
      // Create withdrawn status if it doesn't exist
      const newStatus = await executeQuery(`
        INSERT INTO application_statuses (name) VALUES ('Withdrawn')
      `);
      const withdrawnStatusId = (newStatus as any).insertId;

      // Update application status
      await executeQuery(`
        UPDATE applications 
        SET status_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [withdrawnStatusId, applicationId]);

      // Add to history
      await executeQuery(`
        INSERT INTO application_history (application_id, previous_status_id, new_status_id, changed_by_user_id, notes, created_at)
        SELECT id, status_id, ?, ?, ?, CURRENT_TIMESTAMP
        FROM applications 
        WHERE id = ?
      `, [withdrawnStatusId, userId, 'Application withdrawn by candidate', applicationId]);
    } else {
      const withdrawnStatusId = withdrawnStatusResult[0].id;

      // Update application status
      await executeQuery(`
        UPDATE applications 
        SET status_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [withdrawnStatusId, applicationId]);

      // Add to history
      await executeQuery(`
        INSERT INTO application_history (application_id, previous_status_id, new_status_id, changed_by_user_id, notes, created_at)
        SELECT id, status_id, ?, ?, ?, CURRENT_TIMESTAMP
        FROM applications 
        WHERE id = ?
      `, [withdrawnStatusId, userId, 'Application withdrawn by candidate', applicationId]);
    }

    res.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Handle file upload
export const handleUploadFile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    if (role !== 'Candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    // This is a placeholder - in a real implementation, you'd handle file upload
    // For now, we'll just return a success response
    const { file_type } = req.body;
    
    // Get candidate_id
    const candidateResult = await executeQuery(`
      SELECT id FROM candidate_profiles WHERE user_id = ?
    `, [userId]);

    if (candidateResult.length === 0) {
      return res.status(404).json({ message: 'Candidate profile not found' });
    }

    const candidateId = candidateResult[0].id;

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
    res.status(500).json({ message: 'Internal server error' });
  }
};
