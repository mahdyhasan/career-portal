import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  X,
  Grid,
  List
} from 'lucide-react';
import { jobsApi } from '@/services/api';
import { Job, PaginatedResponse } from '@shared/api';
import { useAuth } from '@/hooks/useAuth';

interface SearchFilters {
  keyword: string;
  location: string;
  jobType: string[];
  experience: string[];
  department: string[];
  salaryMin: string;
  salaryMax: string;
  remoteOnly: boolean;
}

interface SortOption {
  value: string;
  label: string;
}

const sortOptions: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'salary-high', label: 'Salary (High to Low)' },
  { value: 'salary-low', label: 'Salary (Low to High)' },
  { value: 'deadline', label: 'Application Deadline' }
];

export default function JobSearch() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    location: '',
    jobType: [],
    experience: [],
    department: [],
    salaryMin: '',
    salaryMax: '',
    remoteOnly: false
  });
  
  // Sort and pagination
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  
  // Filter options
  const [jobTypes, setJobTypes] = useState<Array<{id: number, name: string}>>([]);
  const [experienceLevels, setExperienceLevels] = useState<Array<{id: number, name: string}>>([]);
  const [departments, setDepartments] = useState<Array<{id: number, name: string}>>([]);
  const [locations, setLocations] = useState<string[]>([]);
  
  // Saved jobs
  const [savedJobs, setSavedJobs] = useState<number[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedJobs();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadJobs();
  }, [currentPage, sortBy]);

  useEffect(() => {
    applyFilters();
  }, [jobs, filters, searchTerm, location]);

  const loadInitialData = async () => {
    try {
      const [jobTypesData, experienceData, departmentsData] = await Promise.all([
        jobsApi.getJobTypes(),
        jobsApi.getExperienceLevels(),
        jobsApi.getDepartments()
      ]);
      
      setJobTypes(jobTypesData);
      setExperienceLevels(experienceData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      const response = await jobsApi.getJobs(currentPage, 20, {
        search: searchTerm || undefined,
        sort: sortBy
      }) as PaginatedResponse<Job>;
      
      setJobs(response.data);
      setTotalPages(response.totalPages);
      setTotalJobs(response.total);
      
      // Extract unique locations
      const uniqueLocations = [...new Set(response.data.map(job => job.location).filter(Boolean))];
      setLocations(uniqueLocations as string[]);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedJobs = async () => {
    try {
      // This would typically call an API to get user's saved jobs
      // For now, use localStorage as a placeholder
      const saved = localStorage.getItem('savedJobs');
      if (saved) {
        setSavedJobs(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load saved jobs:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Apply keyword search
    if (filters.keyword) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        job.summary.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        job.description?.toLowerCase().includes(filters.keyword.toLowerCase())
      );
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Apply job type filter
    if (filters.jobType.length > 0) {
      filtered = filtered.filter(job =>
        filters.jobType.includes(job.job_type?.id.toString() || '')
      );
    }

    // Apply experience level filter
    if (filters.experience.length > 0) {
      filtered = filtered.filter(job =>
        filters.experience.includes(job.experience_level?.id.toString() || '')
      );
    }

    // Apply department filter
    if (filters.department.length > 0) {
      filtered = filtered.filter(job =>
        filters.department.includes(job.department?.id.toString() || '')
      );
    }

    // Apply salary filter
    if (filters.salaryMin) {
      filtered = filtered.filter(job =>
        (job.salary_min || 0) >= parseInt(filters.salaryMin)
      );
    }

    if (filters.salaryMax) {
      filtered = filtered.filter(job =>
        (job.salary_max || Infinity) <= parseInt(filters.salaryMax)
      );
    }

    // Apply remote filter
    if (filters.remoteOnly) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes('remote')
      );
    }

    setFilteredJobs(filtered);
  };

  const handleFilterChange = (type: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const handleMultiSelectFilter = (type: 'jobType' | 'experience' | 'department', value: string) => {
    setFilters(prev => {
      const current = prev[type] as string[];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      keyword: '',
      location: '',
      jobType: [],
      experience: [],
      department: [],
      salaryMin: '',
      salaryMax: '',
      remoteOnly: false
    });
    setSearchTerm('');
    setLocation('');
  };

  const toggleSaveJob = (jobId: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const updated = savedJobs.includes(jobId)
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId];
    
    setSavedJobs(updated);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, keyword: searchTerm }));
  };

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return value !== '';
  }).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Dream Job</h1>
              <p className="text-xl text-gray-600">
                Discover opportunities that match your skills and aspirations
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search by job title, keyword, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 text-lg"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  className="h-12 px-8"
                  size="lg"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </Button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <Input
                  type="text"
                  placeholder="Location (e.g., New York, Remote)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 h-10"
                />
                
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-10"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border-b shadow-sm">
            <div className="container mx-auto px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Job Type Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Job Type</h3>
                  <div className="space-y-2">
                    {jobTypes.map(type => (
                      <Label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={filters.jobType.includes(type.id.toString())}
                          onCheckedChange={() => handleMultiSelectFilter('jobType', type.id.toString())}
                        />
                        <span className="text-sm">{type.name}</span>
                      </Label>
                    ))}
                  </div>
                </div>

                {/* Experience Level Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Experience Level</h3>
                  <div className="space-y-2">
                    {experienceLevels.map(level => (
                      <Label key={level.id} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={filters.experience.includes(level.id.toString())}
                          onCheckedChange={() => handleMultiSelectFilter('experience', level.id.toString())}
                        />
                        <span className="text-sm">{level.name}</span>
                      </Label>
                    ))}
                  </div>
                </div>

                {/* Department Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Department</h3>
                  <div className="space-y-2">
                    {departments.map(dept => (
                      <Label key={dept.id} className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={filters.department.includes(dept.id.toString())}
                          onCheckedChange={() => handleMultiSelectFilter('department', dept.id.toString())}
                        />
                        <span className="text-sm">{dept.name}</span>
                      </Label>
                    ))}
                  </div>
                </div>

                {/* Salary Range Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Salary Range</h3>
                  <div className="space-y-3">
                    <Input
                      type="number"
                      placeholder="Min Salary"
                      value={filters.salaryMin}
                      onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                      className="h-9"
                    />
                    <Input
                      type="number"
                      placeholder="Max Salary"
                      value={filters.salaryMax}
                      onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <Label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={filters.remoteOnly}
                    onCheckedChange={(checked) => handleFilterChange('remoteOnly', checked)}
                  />
                  <span>Remote Only</span>
                </Label>

                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                  <Button onClick={() => setShowFilters(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {filteredJobs.length} Jobs Found
              </h2>
              <p className="text-gray-600">
                {totalJobs} total jobs available
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Jobs Grid/List */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or filters to find more opportunities.
              </p>
              <Button onClick={clearAllFilters}>Clear All Filters</Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  viewMode={viewMode}
                  isSaved={savedJobs.includes(job.id)}
                  onToggleSave={() => toggleSaveJob(job.id)}
                  onViewDetails={() => navigate(`/jobs/${job.id}`)}
                  onQuickApply={() => navigate(`/apply/${job.id}`)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Job Card Component
interface JobCardProps {
  job: Job;
  viewMode: 'grid' | 'list';
  isSaved: boolean;
  onToggleSave: () => void;
  onViewDetails: () => void;
  onQuickApply: () => void;
}

function JobCard({ job, viewMode, isSaved, onToggleSave, onViewDetails, onQuickApply }: JobCardProps) {
  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 
                  className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                  onClick={onViewDetails}
                >
                  {job.title}
                </h3>
                <Badge variant={getStatusVariant(job.status?.name)}>
                  {job.status?.name || 'Unknown'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-gray-600 flex items-center">
                  <Briefcase className="mr-1 h-4 w-4" />
                  {job.department?.name || 'No department'}
                </span>
                <span className="text-sm text-gray-600 flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  {job.location || 'Location not specified'}
                </span>
                <span className="text-sm text-gray-600 flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {job.job_type?.name || 'Not specified'}
                </span>
              </div>

              <p className="text-gray-700 mb-4 line-clamp-2">
                {job.summary}
              </p>

              {(job.salary_min || job.salary_max) && (
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">
                    {formatSalary(job.salary_min, job.salary_max)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-3 ml-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSave}
                className={isSaved ? 'text-yellow-500' : ''}
              >
                {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
              </Button>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onViewDetails}
                >
                  View Details
                </Button>
                <Button 
                  size="sm"
                  onClick={onQuickApply}
                >
                  Quick Apply
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-sm text-gray-500">
              Posted {new Date(job.created_at).toLocaleDateString()}
            </span>
            <span className="text-sm text-gray-500">
              Application deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Not specified'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 mb-2"
              onClick={onViewDetails}
            >
              {job.title}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={getStatusVariant(job.status?.name)}>
                {job.status?.name || 'Unknown'}
              </Badge>
              <Badge variant="outline">
                {job.job_type?.name || 'Not specified'}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSave}
            className={isSaved ? 'text-yellow-500' : ''}
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <Briefcase className="mr-2 h-4 w-4" />
            {job.department?.name || 'No department'}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="mr-2 h-4 w-4" />
            {job.location || 'Location not specified'}
          </div>
          {(job.salary_min || job.salary_max) && (
            <div className="flex items-center text-sm text-green-600 font-medium">
              <DollarSign className="mr-2 h-4 w-4" />
              {formatSalary(job.salary_min, job.salary_max)}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {job.summary}
        </p>
      </CardContent>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-500">
            Posted {new Date(job.created_at).toLocaleDateString()}
          </span>
          {job.deadline && (
            <span className="text-xs text-red-500">
              Deadline: {new Date(job.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={onViewDetails}
          >
            View Details
          </Button>
          <Button 
            size="sm"
            className="flex-1"
            onClick={onQuickApply}
          >
            Quick Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper Functions

function getStatusVariant(statusName?: string) {
  switch (statusName?.toLowerCase()) {
    case 'published':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'closed':
      return 'destructive';
    case 'archived':
      return 'outline';
    default:
      return 'outline';
  }
}

function formatSalary(min?: number, max?: number): string {
  if (min && max) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  } else if (min) {
    return `$${min.toLocaleString()}+`;
  } else if (max) {
    return `Up to $${max.toLocaleString()}`;
  }
  return 'Salary not disclosed';
}