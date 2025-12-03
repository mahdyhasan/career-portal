import { Request, Response } from 'express';
import { SearchService } from '../services/searchService';
import { authenticateToken } from '../middleware/auth';

export const handleSearchJobs = [
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        keyword: req.query.keyword as string,
        location: req.query.location as string,
        department: req.query.department as string,
        jobType: req.query.jobType as string,
        experienceLevel: req.query.experienceLevel as string,
        salaryMin: req.query.salaryMin ? parseInt(req.query.salaryMin as string) : undefined,
        salaryMax: req.query.salaryMax ? parseInt(req.query.salaryMax as string) : undefined,
        remote: req.query.remote === 'true',
        skills: req.query.skills ? (req.query.skills as string).split(',') : undefined,
        postedWithin: req.query.postedWithin ? parseInt(req.query.postedWithin as string) : undefined,
        sortBy: req.query.sortBy as 'relevance' | 'date' | 'salary' | 'title',
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const results = await SearchService.searchJobs(filters);
      
      res.json({ 
        success: true, 
        ...results 
      });
    } catch (error) {
      console.error('Error searching jobs:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleSearchCandidates = [
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { keyword, location, skills, sortBy, sortOrder, page, limit } = req.query;
      
      const skillsArray = skills ? (skills as string).split(',') : [];
      
      const filters = {
        keyword: (keyword as string) || '',
        location: (location as string) || '',
        skills: skillsArray,
        sortBy: sortBy as "title" | "relevance" | "date",
        sortOrder: sortOrder as "asc" | "desc",
        page: parseInt((page as string) || '1'),
        limit: parseInt((limit as string) || '10')
      };

      const results = await SearchService.searchCandidates(filters);
      
      res.json({ 
        success: true, 
        ...results 
      });
    } catch (error) {
      console.error('Error searching candidates:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleSearchApplications = [
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        keyword: req.query.keyword as string,
        status: req.query.status as string,
        jobType: req.query.jobType as string,
        sortBy: req.query.sortBy as 'relevance' | 'date' | 'salary' | 'title',
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20
      };

      const results = await SearchService.searchApplications(filters);
      
      res.json({ 
        success: true, 
        ...results 
      });
    } catch (error) {
      console.error('Error searching applications:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleGetSearchSuggestions = [
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { type, query } = req.query;
      
      if (!type || !query) {
        return res.status(400).json({
          success: false,
          error: 'Type and query parameters are required'
        });
      }

      const suggestions = await SearchService.getSearchSuggestions(
        type as 'skills' | 'locations' | 'departments',
        query as string
      );
      
      res.json({ 
        success: true, 
        suggestions 
      });
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];

export const handleGetFilterOptions = [
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const options = await SearchService.getFilterOptions();
      
      res.json({ 
        success: true, 
        options 
      });
    } catch (error) {
      console.error('Error getting filter options:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
];
