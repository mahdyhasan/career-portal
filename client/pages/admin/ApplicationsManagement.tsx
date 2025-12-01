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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Filter, 
  Eye,
  Download,
  Calendar,
  Mail,
  Briefcase,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText
} from 'lucide-react';

interface Application {
  id: number;
  job_id: number;
  job_title: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'interviewed';
  applied_at: string;
  updated_at: string;
  resume_url: string;
  cover_letter: string;
  experience: string;
  education: string;
  skills: string;
  notes: string;
  interview_date?: string;
  rejection_reason?: string;
}

interface PaginatedApplications {
  data: Application[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ApplicationsManagement() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedJob, setSelectedJob] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadApplications();
  }, [currentPage, search, selectedStatus, selectedJob]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      // In real implementation, this would call the actual API
      // For now, using mock data
      const mockApplications: Application[] = [
        {
          id: 1,
          job_id: 1,
          job_title: 'Senior Frontend Developer',
          candidate_name: 'John Doe',
          candidate_email: 'john.doe@email.com',
          candidate_phone: '+1 (555) 123-4567',
          status: 'reviewing',
          applied_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-16T14:30:00Z',
          resume_url: '/resumes/john_doe_resume.pdf',
          cover_letter: 'I am excited to apply for this position...',
          experience: '5 years of frontend development experience...',
          education: 'Bachelor of Computer Science',
          skills: 'React, TypeScript, Node.js, CSS',
          notes: 'Strong candidate, good portfolio',
          interview_date: '2024-01-20T10:00:00Z'
        },
        {
          id: 2,
          job_id: 1,
          job_title: 'Senior Frontend Developer',
          candidate_name: 'Jane Smith',
          candidate_email: 'jane.smith@email.com',
          candidate_phone: '+1 (555) 987-6543',
          status: 'pending',
          applied_at: '2024-01-14T15:30:00Z',
          updated_at: '2024-01-14T15:30:00Z',
          resume_url: '/resumes/jane_smith_resume.pdf',
          cover_letter: 'Interested in the frontend position...',
          experience: '3 years of web development...',
          education: 'Master of Software Engineering',
          skills: 'Vue.js, JavaScript, HTML, CSS',
          notes: ''
        },
        {
          id: 3,
          job_id: 2,
          job_title: 'Product Manager',
          candidate_name: 'Mike Johnson',
          candidate_email: 'mike.johnson@email.com',
          candidate_phone: '+1 (555) 456-7890',
          status: 'accepted',
          applied_at: '2024-01-13T09:15:00Z',
          updated_at: '2024-01-17T16:45:00Z',
          resume_url: '/resumes/mike_johnson_resume.pdf',
          cover_letter: 'Experienced product manager...',
          experience: '7 years in product management...',
          education: 'MBA from Stanford',
          skills: 'Product Strategy, Agile, Data Analysis',
          notes: 'Excellent fit for the team',
          interview_date: '2024-01-15T14:00:00Z'
        },
        {
          id: 4,
          job_id: 1,
          job_title: 'Senior Frontend Developer',
          candidate_name: 'Sarah Wilson',
          candidate_email: 'sarah.wilson@email.com',
          candidate_phone: '+1 (555) 321-6547',
          status: 'rejected',
          applied_at: '2024-01-12T11:20:00Z',
          updated_at: '2024-01-14T09:30:00Z',
          resume_url: '/resumes/sarah_wilson_resume.pdf',
          cover_letter: 'Frontend developer with experience...',
          experience: '2 years of development...',
          education: 'Bachelor of Information Technology',
          skills: 'HTML, CSS, basic JavaScript',
          notes: 'Not enough experience for senior role',
          rejection_reason: 'Insufficient experience level'
        }
      ];

      setApplications(mockApplications);
      setTotalPages(Math.ceil(mockApplications.length / itemsPerPage));
      setTotalApplications(mockApplications.length);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedJob('all');
    setCurrentPage(1);
  };

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'reviewing':
        return <Eye className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'interviewed':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading && applications.length === 0) {
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
                  <Users className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Applications Management</h1>
                </div>
                <p className="text-muted-foreground text-lg">
                  Review and manage job applications
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
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalApplications}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {applications.filter(a => a.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reviewing</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {applications.filter(a => a.status === 'reviewing').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {applications.filter(a => a.status === 'accepted').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {applications.filter(a => a.status === 'rejected').length}
                  </div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search candidate name or email..."
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="interviewed">Interviewed</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="job">Job</Label>
                    <Select value={selectedJob} onValueChange={(value) => {
                      setSelectedJob(value);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="All jobs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All jobs</SelectItem>
                        <SelectItem value="1">Senior Frontend Developer</SelectItem>
                        <SelectItem value="2">Product Manager</SelectItem>
                        <SelectItem value="3">UX Designer</SelectItem>
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

            {/* Applications Table */}
            <Card>
              <CardHeader>
                <CardTitle>Applications ({totalApplications})</CardTitle>
                <CardDescription>
                  Review and manage all job applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Interview</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="text-muted-foreground mt-2">Loading applications...</p>
                        </TableCell>
                      </TableRow>
                    ) : applications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-muted-foreground">No applications found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      applications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{application.candidate_name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {application.candidate_email}
                              </div>
                              <p className="text-sm text-muted-foreground">{application.candidate_phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              {application.job_title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(application.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(application.status)}
                                {application.status}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(application.applied_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(application.updated_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {application.interview_date ? (
                              <div className="text-sm">
                                {new Date(application.interview_date).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Not scheduled</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewApplication(application)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4" />
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

        {/* View Application Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Full application information and documents
              </DialogDescription>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-6">
                {/* Candidate Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Candidate Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <p className="font-medium">{selectedApplication.candidate_name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="font-medium">{selectedApplication.candidate_email}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="font-medium">{selectedApplication.candidate_phone}</p>
                    </div>
                    <div>
                      <Label>Application Status</Label>
                      <Badge className={getStatusColor(selectedApplication.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(selectedApplication.status)}
                          {selectedApplication.status}
                        </div>
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Job Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Job Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Applied Position</Label>
                      <p className="font-medium">{selectedApplication.job_title}</p>
                    </div>
                    <div>
                      <Label>Applied Date</Label>
                      <p className="font-medium">
                        {new Date(selectedApplication.applied_at).toLocaleString()}
                      </p>
                    </div>
                    {selectedApplication.interview_date && (
                      <div>
                        <Label>Interview Date</Label>
                        <p className="font-medium">
                          {new Date(selectedApplication.interview_date).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedApplication.rejection_reason && (
                      <div>
                        <Label>Rejection Reason</Label>
                        <p className="font-medium text-red-600">{selectedApplication.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Application Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Application Details</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Cover Letter</Label>
                      <p className="text-sm text-muted-foreground mt-1 bg-gray-50 p-3 rounded">
                        {selectedApplication.cover_letter}
                      </p>
                    </div>
                    <div>
                      <Label>Experience</Label>
                      <p className="text-sm text-muted-foreground mt-1 bg-gray-50 p-3 rounded">
                        {selectedApplication.experience}
                      </p>
                    </div>
                    <div>
                      <Label>Education</Label>
                      <p className="text-sm text-muted-foreground mt-1 bg-gray-50 p-3 rounded">
                        {selectedApplication.education}
                      </p>
                    </div>
                    <div>
                      <Label>Skills</Label>
                      <p className="text-sm text-muted-foreground mt-1 bg-gray-50 p-3 rounded">
                        {selectedApplication.skills}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Internal Notes */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Internal Notes</h3>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                    {selectedApplication.notes || 'No notes added yet.'}
                  </p>
                </div>

                {/* Resume Download */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Documents</h3>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download Resume
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </SuperAdminLayout>
    </ProtectedRoute>
  );
}
