import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import SuperAdminLayout from '@/components/admin/SuperAdminLayout';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Eye,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface Job {
  id: number;
  title: string;
  description: string;
  department: string;
  location: string;
  job_type: string;
  salary_min: number;
  salary_max: number;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  applications_count: number;
  posted_by: string;
}

interface PaginatedJobs {
  data: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function JobsManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadJobs();
  }, [currentPage, search, selectedStatus, selectedDepartment, selectedJobType]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      // In real implementation, this would call the actual API
      // For now, using mock data
      const mockJobs: Job[] = [
        {
          id: 1,
          title: 'Senior Frontend Developer',
          description: 'We are looking for an experienced frontend developer...',
          department: 'Engineering',
          location: 'New York, NY',
          job_type: 'full-time',
          salary_min: 80000,
          salary_max: 120000,
          status: 'active',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          applications_count: 45,
          posted_by: 'john.doe@company.com'
        },
        {
          id: 2,
          title: 'Product Manager',
          description: 'Join our product team to drive innovation...',
          department: 'Product',
          location: 'San Francisco, CA',
          job_type: 'full-time',
          salary_min: 100000,
          salary_max: 150000,
          status: 'active',
          created_at: '2024-01-14T15:30:00Z',
          updated_at: '2024-01-14T15:30:00Z',
          applications_count: 32,
          posted_by: 'jane.smith@company.com'
        },
        {
          id: 3,
          title: 'UX Designer',
          description: 'Creative UX designer needed for exciting projects...',
          department: 'Design',
          location: 'Remote',
          job_type: 'contract',
          salary_min: 60,
          salary_max: 80,
          status: 'draft',
          created_at: '2024-01-13T09:15:00Z',
          updated_at: '2024-01-13T09:15:00Z',
          applications_count: 0,
          posted_by: 'mike.wilson@company.com'
        }
      ];

      setJobs(mockJobs);
      setTotalPages(Math.ceil(mockJobs.length / itemsPerPage));
      setTotalJobs(mockJobs.length);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedDepartment('all');
    setSelectedJobType('all');
    setCurrentPage(1);
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getJobTypeColor = (jobType: string) => {
    switch (jobType.toLowerCase()) {
      case 'full-time':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'part-time':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'contract':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'internship':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatSalary = (min: number, max: number, jobType: string) => {
    if (jobType === 'contract') {
      return `$${min}/hr - $${max}/hr`;
    }
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  if (loading && jobs.length === 0) {
    return (
      <ProtectedRoute requireRole="SuperAdmin">
        <SuperAdminLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </SuperAdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireRole="SuperAdmin">
      <SuperAdminLayout>
        <div className="py-8 px-4">
          <div className="container mx-auto max-w-7xl">
            {/* Page Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Briefcase className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Jobs Management</h1>
                </div>
                <p className="text-muted-foreground text-lg">
                  Manage job postings and track applications
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Job
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalJobs}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobs.filter(j => j.status === 'active').length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {jobs.reduce((sum, job) => sum + job.applications_count, 0)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Draft Jobs</CardTitle>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobs.filter(j => j.status === 'draft').length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search job title..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={selectedStatus} onValueChange={(value) => {
                      setSelectedStatus(value);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select value={selectedDepartment} onValueChange={(value) => {
                      setSelectedDepartment(value);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="All departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All departments</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="jobType">Job Type</Label>
                    <Select value={selectedJobType} onValueChange={(value) => {
                      setSelectedJobType(value);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="full-time">Full Time</SelectItem>
                        <SelectItem value="part-time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jobs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Job Postings ({totalJobs})</CardTitle>
                <CardDescription>
                  Manage all job postings and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="text-muted-foreground mt-2">Loading jobs...</p>
                        </TableCell>
                      </TableRow>
                    ) : jobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <p className="text-muted-foreground">No jobs found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{job.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatSalary(job.salary_min, job.salary_max, job.job_type)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{job.department}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {job.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getJobTypeColor(job.job_type)}>
                              {job.job_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {job.applications_count}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{new Date(job.created_at).toLocaleDateString()}</p>
                              <p className="text-muted-foreground">{job.posted_by}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewJob(job)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* View Job Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedJob?.title}</DialogTitle>
              <DialogDescription>
                Job details and information
              </DialogDescription>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Department</Label>
                    <p className="font-medium">{selectedJob.department}</p>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <p className="font-medium">{selectedJob.location}</p>
                  </div>
                  <div>
                    <Label>Job Type</Label>
                    <Badge className={getJobTypeColor(selectedJob.job_type)}>
                      {selectedJob.job_type}
                    </Badge>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusColor(selectedJob.status)}>
                      {selectedJob.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Salary Range</Label>
                    <p className="font-medium">
                      {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.job_type)}
                    </p>
                  </div>
                  <div>
                    <Label>Applications</Label>
                    <p className="font-medium">{selectedJob.applications_count}</p>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedJob.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Posted By</Label>
                    <p className="font-medium">{selectedJob.posted_by}</p>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p className="font-medium">
                      {new Date(selectedJob.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </SuperAdminLayout>
    </ProtectedRoute>
  );
}
