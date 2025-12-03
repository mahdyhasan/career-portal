// server/routes/fileManagement.ts
import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import { executeQuery, executeSingleQuery, findOne } from '../config/database';
import fs from 'fs';
import path from 'path';

// Get user's files with metadata
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
      SELECT 
        ca.id,
        ca.file_type,
        ca.file_url,
        ca.uploaded_at,
        ca.file_size,
        ca.mime_type,
        ca.original_name
      FROM candidate_attachments ca
      WHERE ca.candidate_profile_id = (
        SELECT id FROM candidate_profiles WHERE user_id = ?
      )
    `;
    
    const params: any[] = [user.id];

    if (fileType) {
      query += ' AND ca.file_type = ?';
      params.push(fileType);
    }

    query += ' ORDER BY ca.uploaded_at DESC';

    const files = await executeQuery(query, params);

    const filesWithMetadata = files.map((file: any) => ({
      id: file.id,
      fileType: file.file_type,
      fileUrl: file.file_url,
      uploadedAt: file.uploaded_at,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      originalName: file.original_name,
      canPreview: canPreviewFile(file.mime_type),
      downloadUrl: `/api/files/download/${file.id}`
    }));

    res.json({
      files: filesWithMetadata
    });

  } catch (error) {
    console.error('Get user files error:', error);
    res.status(500).json({
      message: 'Failed to retrieve files',
      code: 'RETRIEVE_FAILED'
    });
  }
};

// Download file
export const handleDownloadFile: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const fileId = parseInt(req.params.fileId);

    if (!user || !fileId) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Verify file belongs to user
    const file = await findOne<any>(`
      SELECT 
        ca.file_url,
        ca.original_name,
        ca.mime_type,
        ca.file_size
      FROM candidate_attachments ca
      WHERE ca.id = ? AND ca.candidate_profile_id = (
        SELECT id FROM candidate_profiles WHERE user_id = ?
      )
    `, [fileId, user.id]);

    if (!file) {
      return res.status(404).json({
        message: 'File not found or access denied',
        code: 'FILE_NOT_FOUND'
      });
    }

    const filePath = path.join(process.cwd(), file.file_url.replace('/assets/', 'public/assets/'));

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'File not found on disk',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', file.file_size || '');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      message: 'Failed to download file',
      code: 'DOWNLOAD_FAILED'
    });
  }
};

// Preview file (for supported types)
export const handlePreviewFile: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const fileId = parseInt(req.params.fileId);

    if (!user || !fileId) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Verify file belongs to user
    const file = await findOne<any>(`
      SELECT 
        ca.file_url,
        ca.original_name,
        ca.mime_type,
        ca.file_size
      FROM candidate_attachments ca
      WHERE ca.id = ? AND ca.candidate_profile_id = (
        SELECT id FROM candidate_profiles WHERE user_id = ?
      )
    `, [fileId, user.id]);

    if (!file) {
      return res.status(404).json({
        message: 'File not found or access denied',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Check if file type is previewable
    if (!canPreviewFile(file.mime_type)) {
      return res.status(400).json({
        message: 'File type not supported for preview',
        code: 'PREVIEW_NOT_SUPPORTED'
      });
    }

    const filePath = path.join(process.cwd(), file.file_url.replace('/assets/', 'public/assets/'));

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'File not found on disk',
        code: 'FILE_NOT_FOUND'
      });
    }

    // For PDF files, return the file directly
    if (file.mime_type === 'application/pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      // For other previewable types, return file info
      res.json({
        file: {
          id: fileId,
          name: file.original_name,
          type: file.mime_type,
          size: file.file_size,
          previewUrl: file.file_url
        }
      });
    }

  } catch (error) {
    console.error('Preview file error:', error);
    res.status(500).json({
      message: 'Failed to preview file',
      code: 'PREVIEW_FAILED'
    });
  }
};

// Get file metadata
export const handleGetFileMetadata: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const fileId = parseInt(req.params.fileId);

    if (!user || !fileId) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const file = await findOne<any>(`
      SELECT 
        ca.id,
        ca.file_type,
        ca.file_url,
        ca.uploaded_at,
        ca.file_size,
        ca.mime_type,
        ca.original_name,
        ca.checksum
      FROM candidate_attachments ca
      WHERE ca.id = ? AND ca.candidate_profile_id = (
        SELECT id FROM candidate_profiles WHERE user_id = ?
      )
    `, [fileId, user.id]);

    if (!file) {
      return res.status(404).json({
        message: 'File not found or access denied',
        code: 'FILE_NOT_FOUND'
      });
    }

    const fileStats = fs.statSync(path.join(process.cwd(), file.file_url.replace('/assets/', 'public/assets/')));

    res.json({
      metadata: {
        id: file.id,
        name: file.original_name,
        type: file.file_type,
        mimeType: file.mime_type,
        size: file.file_size,
        uploadedAt: file.uploaded_at,
        lastModified: fileStats.mtime,
        canPreview: canPreviewFile(file.mime_type),
        downloadUrl: `/api/files/download/${file.id}`,
        previewUrl: `/api/files/preview/${file.id}`,
        checksum: file.checksum
      }
    });

  } catch (error) {
    console.error('Get file metadata error:', error);
    res.status(500).json({
      message: 'Failed to get file metadata',
      code: 'METADATA_FAILED'
    });
  }
};

// Update file metadata
export const handleUpdateFileMetadata: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const fileId = parseInt(req.params.fileId);
    const { name, tags, notes } = req.body;

    if (!user || !fileId) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Verify file belongs to user
    const file = await findOne<any>(`
      SELECT id FROM candidate_attachments 
      WHERE id = ? AND candidate_profile_id = (
        SELECT id FROM candidate_profiles WHERE user_id = ?
      )
    `, [fileId, user.id]);

    if (!file) {
      return res.status(404).json({
        message: 'File not found or access denied',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Update metadata
    await executeSingleQuery(`
      UPDATE candidate_attachments 
      SET 
        original_name = COALESCE(?, original_name),
        tags = COALESCE(?, tags),
        notes = COALESCE(?, notes),
        updated_at = NOW()
      WHERE id = ?
    `, [name, tags, notes, fileId]);

    res.json({
      message: 'File metadata updated successfully'
    });

  } catch (error) {
    console.error('Update file metadata error:', error);
    res.status(500).json({
      message: 'Failed to update file metadata',
      code: 'UPDATE_FAILED'
    });
  }
};

// Delete file
export const handleDeleteFile: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const fileId = parseInt(req.params.fileId);

    if (!user || !fileId) {
      return res.status(401).json({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Verify file belongs to user
    const file = await findOne<any>(`
      SELECT file_url FROM candidate_attachments 
      WHERE id = ? AND candidate_profile_id = (
        SELECT id FROM candidate_profiles WHERE user_id = ?
      )
    `, [fileId, user.id]);

    if (!file) {
      return res.status(404).json({
        message: 'File not found or access denied',
        code: 'FILE_NOT_FOUND'
      });
    }

    const filePath = path.join(process.cwd(), file.file_url.replace('/assets/', 'public/assets/'));

    // Delete physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await executeSingleQuery(`
      DELETE FROM candidate_attachments 
      WHERE id = ?
    `, [fileId]);

    res.json({
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      message: 'Failed to delete file',
      code: 'DELETE_FAILED'
    });
  }
};

// Helper Functions

function canPreviewFile(mimeType?: string): boolean {
  const previewableTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/html'
  ];
  
  return previewableTypes.includes(mimeType || '');
}

function generateFileChecksum(filePath: string): string {
  // This would typically use crypto to generate a checksum
  // For now, return a placeholder
  return 'checksum-placeholder';
}
