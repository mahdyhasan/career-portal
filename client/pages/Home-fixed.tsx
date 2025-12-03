import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, MapPin, DollarSign, Briefcase, Clock, Search, Filter, ChevronDown, X, Plus } from 'lucide-react';
import { jobsApi } from '@/services/api';
import { Job, PaginatedResponse } from '@shared/api';
import { useAuth } from '@/hooks/useAuth';

// Extended interface for jobs with joined fields from API
interface JobWithDetails extends Job {
  department_name?: string;
  job_type_name?: string;
  experience_level_name?: string;
  status_name?: string;
}

export default function Home() {
  const { isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const [jobs, setJobs] = useState<JobWithDetails[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Available filter options
  const [jobTypes, setJobTypes] = useState<Array<{id: number, name: string}>>([]);
  const [departments, setDepartments] = useState<Array<{id: number, name: string}>>([]);
  const [experienceLevels, setExperienceLevels] = useState<Array<{id: number, name: string}>>([]);

  useEffect(() => {
    loadJobs();
    loadFilterOptions();
  }, [currentPage]);

  useEffect(() => {
    filterAndSortJobs();
  }, [jobs, searchTerm, selectedJobType, selectedDepartment, selectedExperience, sortBy]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await jobsApi.getJobs(currentPage, 12, {
        search: searchTerm || undefined,
        job_type_id: selectedJobType !== 'all' ? parseInt(selectedJobType) : undefined,
        department_id: selectedDepartment !== 'all' ? parseInt(selectedDepartment) : undefined,
        experience_level_id: selectedExperience !== 'all' ? parseInt(selectedExperience) : undefined,
      }) as PaginatedResponse<JobWithDetails>;
      
      setJobs(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      // Load job types
      const jobTypesResponse = await jobsApi.getJobTypes();
      setJobTypes(jobTypesResponse);
      
      // Load departments
      const departmentsResponse = await jobsApi.getDepartments();
      setDepartments(departmentsResponse);
      
      // Load experience levels
      const experienceResponse = await jobsApi.getExperienceLevels();
      setExperienceLevels(experienceResponse);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const filterAndSortJobs = () => {
    let filtered = [...jobs];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.summary.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (selectedJobType !== 'all') {
      filtered = filtered.filter(job => job.job_type_id === parseInt(selectedJobType));
    }
    
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(job => job.department_id === parseInt(selectedDepartment));
    }
    
    if (selectedExperience !== 'all') {
      filtered = filtered.filter(job => job.experience_level_id === parseInt(selectedExperience));
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    setFilteredJobs(filtered);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadJobs();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedJobType('all');
    setSelectedDepartment('all');
    setSelectedExperience('all');
    setSortBy('newest');
  };

  const getStatusBadgeVariant = (statusName?: string) => {
    switch (statusName?.toLowerCase()) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'closed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getJobTypeBadgeVariant = (jobTypeName?: string) => {
    switch (jobTypeName?.toLowerCase()) {
      case 'full-time':
        return 'default';
      case 'part-time':
        return 'secondary';
      case 'remote':
        return 'outline';
      case 'contract':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={loadJobs}>Try Again</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find Your Dream Career
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Join our team and build the future together
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search jobs by title or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-white text-gray-900"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    onClick={handleSearch}
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-sm text-gray-600"
              >
                Clear all
              </Button>

              {(isAdmin || isSuperAdmin) && (
                <Link to="/admin/create-job" className="ml-auto">
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Post New Job
                  </Button>
                </Link>
              )}
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Job Type</Label>
                  <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All job types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All job types</SelectItem>
                      {jobTypes.map(type => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Department</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Experience Level</Label>
                  <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                    <SelectTrigger>
                      <SelectValue placeholder="All experience levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All experience levels</SelectItem>
                      {experienceLevels.map(level => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Positions ({filteredJobs.length})
            </h2>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or filters
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant={getJobTypeBadgeVariant(job.job_type?.name)}>
                            {job.job_type?.name || 'Not specified'}
                          </Badge>
                          {(isAdmin || isSuperAdmin) && job.status && (
                            <Badge variant={getStatusBadgeVariant(job.status.name)}>
                              {job.status.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {job.department?.name && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Briefcase className="h-4 w-4 mr-2" />
                          {job.department.name}
                        </div>
                      )}
                      
                      {job.experience_level?.name && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {job.experience_level.name}
                        </div>
                      )}
                      
                      {(job.salary_min || job.salary_max) && (
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          {job.salary_min && job.salary_max 
                            ? `${job.salary_min} - ${job.salary_max}`
                            : job.salary_min || job.salary_max || 'Not specified'
                          }
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {job.summary}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                      
                      <div className="flex gap-2">
                        <Link to={`/jobs/${job.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        
                        {isAuthenticated && !isAdmin && !isSuperAdmin && (
                          <Link to={`/apply/${job.id}`}>
                            <Button size="sm" className="flex items-center gap-1">
                              Apply Now
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center">
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