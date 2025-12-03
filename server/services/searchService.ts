import pool from '../config/database';

export interface SearchFilters {
  keyword?: string;
  location?: string;
  department?: string;
  jobType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  remote?: boolean;
  skills?: string[];
  postedWithin?: number; // days
  status?: string;
  sortBy?: 'relevance' | 'date' | 'salary' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface JobSearchResult {
  jobs: any[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CandidateSearchResult {
  candidates: any[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApplicationSearchResult {
  applications: any[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class SearchService {
  
  static async searchJobs(filters: SearchFilters): Promise<JobSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = ['j.status = "active"'];
    let joinConditions: string[] = [];
    let params: any[] = [];

    // Build where conditions based on filters
    if (filters.keyword) {
      whereConditions.push('(j.title LIKE ? OR j.summary LIKE ? OR j.description LIKE ?)');
      const keywordParam = `%${filters.keyword}%`;
      params.push(keywordParam, keywordParam, keywordParam);
    }

    if (filters.location) {
      whereConditions.push('(c.name LIKE ? OR j.location LIKE ?)');
      const locationParam = `%${filters.location}%`;
      params.push(locationParam, locationParam);
    }

    if (filters.department) {
      whereConditions.push('d.id = ?');
      params.push(filters.department);
    }

    if (filters.jobType) {
      whereConditions.push('jt.id = ?');
      params.push(filters.jobType);
    }

    if (filters.experienceLevel) {
      whereConditions.push('el.id = ?');
      params.push(filters.experienceLevel);
    }

    if (filters.salaryMin) {
      whereConditions.push('j.salary >= ?');
      params.push(filters.salaryMin);
    }

    if (filters.salaryMax) {
      whereConditions.push('j.salary <= ?');
      params.push(filters.salaryMax);
    }

    if (filters.remote !== undefined) {
      whereConditions.push('j.is_remote = ?');
      params.push(filters.remote);
    }

    if (filters.postedWithin) {
      whereConditions.push('j.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)');
      params.push(filters.postedWithin);
    }

    if (filters.skills && filters.skills.length > 0) {
      joinConditions.push(`
        JOIN job_skills js ON j.id = js.job_id
        JOIN skills s ON js.skill_id = s.id
      `);
      whereConditions.push(`s.name IN (${filters.skills.map(() => '?').join(',')})`);
      params.push(...filters.skills);
    }

    // Build the complete query
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const joinClause = joinConditions.join(' ');

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT j.id) as count
      FROM jobs j
      JOIN users u ON j.created_by = u.id
      JOIN departments d ON j.department_id = d.id
      JOIN job_types jt ON j.job_type_id = jt.id
      JOIN experience_levels el ON j.experience_level_id = el.id
      LEFT JOIN cities c ON j.city_id = c.id
      ${joinClause}
      ${whereClause}
    `;

    const [countRows]: any = await pool.execute(countQuery, params);
    const totalCount = countRows[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    // Get the actual results
    let orderBy = '';
    switch (filters.sortBy) {
      case 'date':
        orderBy = 'j.created_at';
        break;
      case 'salary':
        orderBy = 'j.salary';
        break;
      case 'title':
        orderBy = 'j.title';
        break;
      default:
        orderBy = 'j.created_at';
    }

    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const query = `
      SELECT 
        j.*,
        u.first_name,
        u.last_name,
        d.name as department_name,
        jt.name as job_type_name,
        el.name as experience_level_name,
        c.name as city_name,
        GROUP_CONCAT(DISTINCT s.name) as required_skills
      FROM jobs j
      JOIN users u ON j.created_by = u.id
      JOIN departments d ON j.department_id = d.id
      JOIN job_types jt ON j.job_type_id = jt.id
      JOIN experience_levels el ON j.experience_level_id = el.id
      LEFT JOIN cities c ON j.city_id = c.id
      LEFT JOIN job_skills js ON j.id = js.job_id
      LEFT JOIN skills s ON js.skill_id = s.id
      ${whereClause}
      GROUP BY j.id
      ORDER BY ${orderBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const finalParams = [...params, limit, offset];
    const [rows]: any = await pool.execute(query, finalParams);

    return {
      jobs: rows,
      totalCount,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  static async searchCandidates(filters: SearchFilters): Promise<CandidateSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = ['u.role = "Candidate"'];
    let joinConditions: string[] = [];
    let params: any[] = [];

    // Build where conditions based on filters
    if (filters.keyword) {
      whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)');
      const keywordParam = `%${filters.keyword}%`;
      params.push(keywordParam, keywordParam, keywordParam);
    }

    if (filters.location) {
      whereConditions.push('c.name LIKE ?');
      params.push(`%${filters.location}%`);
    }

    if (filters.skills && filters.skills.length > 0) {
      joinConditions.push(`
        JOIN user_skills us ON u.id = us.user_id
        JOIN skills s ON us.skill_id = s.id
      `);
      whereConditions.push(`s.name IN (${filters.skills.map(() => '?').join(',')})`);
      params.push(...filters.skills);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const joinClause = joinConditions.join(' ');

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN cities c ON u.city_id = c.id
      ${joinClause}
      ${whereClause}
    `;

    const [countRows]: any = await pool.execute(countQuery, params);
    const totalCount = countRows[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    // Get the actual results
    const query = `
      SELECT 
        u.*,
        c.name as city_name,
        GROUP_CONCAT(DISTINCT s.name) as skills
      FROM users u
      LEFT JOIN cities c ON u.city_id = c.id
      LEFT JOIN user_skills us ON u.id = us.user_id
      LEFT JOIN skills s ON us.skill_id = s.id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const finalParams = [...params, limit, offset];
    const [rows]: any = await pool.execute(query, finalParams);

    return {
      candidates: rows,
      totalCount,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  static async searchApplications(filters: SearchFilters): Promise<ApplicationSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: any[] = [];

    // Build where conditions based on filters
    if (filters.keyword) {
      whereConditions.push('(j.title LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
      const keywordParam = `%${filters.keyword}%`;
      params.push(keywordParam, keywordParam, keywordParam);
    }

    if (filters.status) {
      whereConditions.push('a.status = ?');
      params.push(filters.status);
    }

    if (filters.jobType) {
      whereConditions.push('jt.id = ?');
      params.push(filters.jobType);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.user_id = u.id
      JOIN job_types jt ON j.job_type_id = jt.id
      ${whereClause}
    `;

    const [countRows]: any = await pool.execute(countQuery, params);
    const totalCount = countRows[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    // Get the actual results
    const query = `
      SELECT 
        a.*,
        j.title as job_title,
        u.first_name,
        u.last_name,
        u.email,
        jt.name as job_type_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.user_id = u.id
      JOIN job_types jt ON j.job_type_id = jt.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const finalParams = [...params, limit, offset];
    const [rows]: any = await pool.execute(query, finalParams);

    return {
      applications: rows,
      totalCount,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  static async getSearchSuggestions(type: 'skills' | 'locations' | 'departments', query: string): Promise<string[]> {
    let sql: string;
    let params: any[] = [`%${query}%`];

    switch (type) {
      case 'skills':
        sql = 'SELECT name FROM skills WHERE name LIKE ? ORDER BY name LIMIT 10';
        break;
      case 'locations':
        sql = 'SELECT name FROM cities WHERE name LIKE ? ORDER BY name LIMIT 10';
        break;
      case 'departments':
        sql = 'SELECT name FROM departments WHERE name LIKE ? ORDER BY name LIMIT 10';
        break;
      default:
        return [];
    }

    const [rows]: any = await pool.execute(sql, params);
    return rows.map((row: any) => row.name);
  }

  static async getFilterOptions(): Promise<any> {
    const [
      departments,
      jobTypes,
      experienceLevels,
      cities
    ] = await Promise.all([
      this.getDepartments(),
      this.getJobTypes(),
      this.getExperienceLevels(),
      this.getCities()
    ]);

    return {
      departments,
      jobTypes,
      experienceLevels,
      cities
    };
  }

  private static async getDepartments(): Promise<any[]> {
    const [rows]: any = await pool.execute('SELECT id, name FROM departments ORDER BY name');
    return rows;
  }

  private static async getJobTypes(): Promise<any[]> {
    const [rows]: any = await pool.execute('SELECT id, name FROM job_types ORDER BY name');
    return rows;
  }

  private static async getExperienceLevels(): Promise<any[]> {
    const [rows]: any = await pool.execute('SELECT id, name FROM experience_levels ORDER BY name');
    return rows;
  }

  private static async getCities(): Promise<any[]> {
    const [rows]: any = await pool.execute('SELECT id, name FROM cities ORDER BY name');
    return rows;
  }
}
