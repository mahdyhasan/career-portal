// server/services/fileUploadService.ts
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directories exist
const uploadDirs = {
  resume: path.join(process.cwd(), 'public', 'assets', 'resume'),
  coverLetter: path.join(process.cwd(), 'public', 'assets', 'cover-letter'),
  portfolio: path.join(process.cwd(), 'public', 'assets', 'portfolio')
};

// Create directories if they don't exist
Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File filter function
const fileFilter = (req: any, file: any, cb: FileFilterCallback) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = req.body.fileType || 'resume';
    const uploadDir = uploadDirs[fileType as keyof typeof uploadDirs] || uploadDirs.resume;
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Multer upload instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

export interface FileUploadResult {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
}

export class FileUploadService {
  
  static async uploadFile(
    file: any, 
    userId: number, 
    fileType: 'resume' | 'coverLetter' | 'portfolio'
  ): Promise<FileUploadResult> {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Generate file URL (publicly accessible)
      const fileUrl = `/assets/${fileType === 'coverLetter' ? 'cover-letter' : fileType}/${path.basename(file.path)}`;

      const result: FileUploadResult = {
        filename: path.basename(file.path),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url: fileUrl
      };

      return result;
    } catch (error) {
      // Clean up file if upload fails
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  }

  static async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  static async getFileStats(filePath: string): Promise<fs.Stats> {
    try {
      return fs.statSync(filePath);
    } catch (error) {
      throw new Error('File not found');
    }
  }

  static validateFileType(mimeType: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return allowedTypes.includes(mimeType);
  }

  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
