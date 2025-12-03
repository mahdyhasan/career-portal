// server/routes/fileUpload.ts
import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FileUploadService, upload } from '../services/fileUploadService';
import { executeQuery, executeSingleQuery } from '../config/database';

// File upload endpoint
export const handleFileUpload: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const fileType = req.body.fileType as 'resume' | 'coverLetter' | 'portfolio';
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    if (!fileType || !['resume', 'coverLetter', 'portfolio'].includes(fileType)) {
      return res.status(400).json({
        message: 'Invalid file type. Must be resume, coverLetter, or portfolio',
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Upload file
    const uploadResult = await FileUploadService.uploadFile(file, user.id, fileType);

    // Get candidate profile ID from user ID
    const candidateProfile = await executeQuery(
      'SELECT id FROM candidate_profiles WHERE user_id = ?',
      [user.id]
    );
    
    if (!candidateProfile || candidateProfile.length === 0) {
      return res.status(404).json({
        message: 'Candidate profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Save file metadata to database
    const query = `
      INSERT INTO candidate_attachments 
      (candidate_profile_id, file_type, file_url, uploaded_at) 
      VALUES (?, ?, ?, NOW())
    `;
    
    const result = await executeSingleQuery(query, [
      candidateProfile[0].id, // Use actual candidate profile ID
      fileType,
      uploadResult.url
    ]);

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: result.insertId,
        ...uploadResult,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'File upload failed',
      code: 'UPLOAD_FAILED'
    });
  }
};

// Get user's files endpoint
export const handleGetUserFiles: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { fileType } = req.query;

    let query = `
      SELECT id, file_type, file_url, uploaded_at 
      FROM candidate_attachments 
      WHERE candidate_profile_id = ?
    `;
    
    // Get candidate profile ID from user ID
    const candidateProfile = await executeQuery(
      'SELECT id FROM candidate_profiles WHERE user_id = ?',
      [user.id]
    );
    
    if (!candidateProfile || candidateProfile.length === 0) {
      return res.status(404).json({
        message: 'Candidate profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }
    
    const params = [candidateProfile[0].id];

    if (fileType) {
      query += ' AND file_type = ?';
      params.push(fileType as string);
    }

    query += ' ORDER BY uploaded_at DESC';

    const files = await executeQuery(query, params);

    res.json({
      files: files.map((file: any) => ({
        id: file.id,
        fileType: file.file_type,
        fileUrl: file.file_url,
        uploadedAt: file.uploaded_at
      }))
    });

  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      message: 'Failed to retrieve files',
      code: 'RETRIEVE_FAILED'
    });
  }
};

// Delete file endpoint
export const handleDeleteFile: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { fileId } = req.params;

    // Get candidate profile ID from user ID
    const candidateProfile = await executeQuery(
      'SELECT id FROM candidate_profiles WHERE user_id = ?',
      [user.id]
    );
    
    if (!candidateProfile || candidateProfile.length === 0) {
      return res.status(404).json({
        message: 'Candidate profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    // Check if file belongs to user
    const checkQuery = `
      SELECT file_url FROM candidate_attachments 
      WHERE id = ? AND candidate_profile_id = ?
    `;
    
    const fileResult = await executeQuery(checkQuery, [parseInt(fileId), candidateProfile[0].id]);
    
    if (!fileResult || fileResult.length === 0) {
      return res.status(404).json({
        message: 'File not found or access denied',
        code: 'FILE_NOT_FOUND'
      });
    }

    const fileUrl = fileResult[0].file_url;
    const filePath = fileUrl.replace('/assets/', 'public/assets/');

    // Delete physical file
    await FileUploadService.deleteFile(filePath);

    // Delete database record
    const deleteQuery = `
      DELETE FROM candidate_attachments 
      WHERE id = ? AND candidate_profile_id = ?
    `;
    
    await executeSingleQuery(deleteQuery, [parseInt(fileId), candidateProfile[0].id]);

    res.json({
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'File deletion failed',
      code: 'DELETE_FAILED'
    });
  }
};

// Multer middleware for single file upload
export const uploadMiddleware = upload.single('file');
