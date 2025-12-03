import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Eye, 
  Filter, 
  Search, 
  Calendar, 
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  User,
  Briefcase,
  Mail,
  Phone
} from 'lucide-react';
import { jobsApi } from '@/services/api';
import { Application, Job } from '@shared/api';
import { useAuth } from '@/hooks/useAuth';

export default function Applications() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadApplications();
  }, [id]);

  useEffect(() => {
    filterAndSortApplications();
  }, [applications, searchTerm, statusFilter, jobFilter, sortBy]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      
      let response;
      if (id) {
        // Load specific application
        response = await jobsApi.getApplication(parseInt(id));
        setSelectedApplication(response);
      } else {
        // Load all applications
        response = await jobsApi.getApplications(1, 50);
        setApplications(response.data);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortApplications = () => {
    let filtered = [...applications];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.candidate?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.candidate?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status?.name === statusFilter);
    }

    // Apply job filter
    if (jobFilter !== 'all') {
      filtered = filtered.filter(app => app.job_id === parseInt(jobFilter));
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => (a.candidate?.full_name || '').localeCompare(b.candidate?.full_name || ''));
        break;
      case 'status':
        filtered.sort((a, b) => (a.status?.name || '').localeCompare(b.status?.name || ''));
        break;
    }

    setFilteredApplications(filtered);
  };

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      await jobsApi.updateApplicationStatus(applicationId, newStatus);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: { ...app.status, name: newStatus } }
            : app
        )
      );

      // Show success message
      // You can add a toast notification here
      console.log('Application status updated successfully');
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

  const handleNextAction = async (applicationId: number, action: string) => {
    try {
      // Implement next action logic
      console.log('Setting next action:', action, 'for application:', applicationId);
      
      // For now, just update the status based on the action
      let newStatus = '';
      switch (action) {
        case 'schedule-interview':
          newStatus = 'Interview';
          break;
        case 'make-offer':
          newStatus = 'Offer';
          break;
        case 'reject':
          newStatus = 'Rejected';
          break;
        default:
          return;
      }
      
      await handleStatusChange(applicationId, newStatus);
    } catch (error) {
      console.error('Failed to set next action:', error);
    }
  };

  const handleDownloadResume = async (applicationId: number) => {
    try {
      // Implement resume download logic
      console.log('Downloading resume for application:', applicationId);
      // This would typically involve calling an API endpoint that returns the file
    } catch (error) {
      console.error('Failed to download resume:', error);
    }
  };

  const handleViewResume = async (applicationId: number) => {
    try {
      // Implement resume preview logic
      console.log('Viewing resume for application:', applicationId);
      // This would open a modal or new tab with the resume preview
    } catch (error) {
      console.error('Failed to view resume:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (id && selectedApplication) {
    return <ApplicationDetails application={selectedApplication} onStatusChange={handleStatusChange} />;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Applications Management</h1>
          <p className="text-gray-600 mt-2">
            {isSuperAdmin ? 'Manage all applications system-wide' : 'Review applications for your jobs'}
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search by name, email, or job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Screening">Screening</SelectItem>
                    <SelectItem value="Interview">Interview</SelectItem>
                    <SelectItem value="Offer">Offer</SelectItem>
                    <SelectItem value="Hired">Hired</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Job</label>
                <Select value={jobFilter} onValueChange={setJobFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {/* Add job options here */}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Applications ({filteredApplications.length})</CardTitle>
            <CardDescription>
              {isSuperAdmin ? 'All applications in the system' : 'Applications to your job postings'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No applications found matching your criteria.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <ApplicationCard 
                    key={application.id} 
                    application={application}
                    onStatusChange={handleStatusChange}
                    onNextAction={handleNextAction}
                    onDownloadResume={handleDownloadResume}
                    onViewResume={handleViewResume}
                    isAdmin={isAdmin || isSuperAdmin}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// Application Card Component
function ApplicationCard({ 
  application, 
  onStatusChange, 
  onNextAction, 
  onDownloadResume, 
  onViewResume,
  isAdmin 
}: any) {
  const navigate = useNavigate();

  return (
    <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {(application.candidate?.full_name || 'Unknown').split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {application.candidate?.full_name || 'Unknown Candidate'}
              </h3>
              <p className="text-sm text-gray-600">
                {application.candidate?.email || 'No email'}
              </p>
              {application.candidate?.phone && (
                <p className="text-sm text-gray-600">
                  {application.candidate.phone}
                </p>
              )}
            </div>
          </div>

          <div className="mb-3">
            <h4 className="font-medium text-gray-900">
              Applied for: {application.job?.title || 'Unknown Job'}
            </h4>
            <p className="text-sm text-gray-600">
              {application.job?.department?.name || 'No department'} • {application.job?.job_type?.name || 'Not specified'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Applied {new Date(application.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {getTimeAgo(application.created_at)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant={getStatusVariant(application.status?.name)}>
            {application.status?.name || 'Unknown'}
          </Badge>
          
          {isAdmin && (
            <Select 
              value={application.status?.name || ''} 
              onValueChange={(value) => onStatusChange(application.id, value)}
            >
              <SelectTrigger className="w-32 text-xs">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Applied">Applied</SelectItem>
                <SelectItem value="Screening">Screening</SelectItem>
                <SelectItem value="Interview">Interview</SelectItem>
                <SelectItem value="Offer">Offer</SelectItem>
                <SelectItem value="Hired">Hired</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Application Answers */}
      {application.answers && application.answers.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium mb-2">Application Responses:</h5>
          <div className="space-y-2">
            {application.answers.map((answer: any, index: number) => (
              <div key={index} className="text-sm">
                <p className="font-medium text-gray-700">{answer.form_field?.label}:</p>
                <p className="text-gray-600">{answer.answer_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate(`/applications/${application.id}`)}
          >
            <Eye className="mr-1 h-4 w-4" />
            View Details
          </Button>
          
          {isAdmin && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onViewResume(application.id)}
              >
                <Eye className="mr-1 h-4 w-4" />
                View Resume
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onDownloadResume(application.id)}
              >
                <Download className="mr-1 h-4 w-4" />
                Download Resume
              </Button>
            </>
          )}
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Select onValueChange={(value) => onNextAction(application.id, value)}>
              <SelectTrigger className="w-40 text-xs">
                <SelectValue placeholder="Next Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="schedule-interview">Schedule Interview</SelectItem>
                <SelectItem value="make-offer">Make Offer</SelectItem>
                <SelectItem value="reject">Reject Application</SelectItem>
                <SelectItem value="request-info">Request More Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

// Application Details Component
function ApplicationDetails({ application, onStatusChange }: any) {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/admin/applications')}>
            ← Back to Applications
          </Button>
          <h1 className="text-2xl font-bold">Application Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Information */}
            <Card>
              <CardHeader>
                <CardTitle>Candidate Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-lg">{application.candidate?.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-lg">{application.candidate?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-lg">{application.candidate?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Location</label>
                    <p className="text-lg">{application.candidate?.location || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Information */}
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Job Title</label>
                    <p className="text-lg">{application.job?.title || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Department</label>
                    <p className="text-lg">{application.job?.department?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Job Type</label>
                    <p className="text-lg">{application.job?.job_type?.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Experience Level</label>
                    <p className="text-lg">{application.job?.experience_level?.name || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Responses */}
            {application.answers && application.answers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Application Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {application.answers.map((answer: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {answer.form_field?.label}
                        </h4>
                        <p className="text-gray-700">{answer.answer_text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Status:</span>
                    <Badge variant={getStatusVariant(application.status?.name)}>
                      {application.status?.name || 'Unknown'}
                    </Badge>
                  </div>
                  
                  <Select 
                    value={application.status?.name || ''} 
                    onValueChange={(value) => onStatusChange(application.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Screening">Screening</SelectItem>
                      <SelectItem value="Interview">Interview</SelectItem>
                      <SelectItem value="Offer">Offer</SelectItem>
                      <SelectItem value="Hired">Hired</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="text-sm text-gray-600">
                    <p>Applied on: {new Date(application.created_at).toLocaleDateString()}</p>
                    <p>Last updated: {new Date(application.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </Button>
                <Button variant="outline" className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
                <Button variant="outline" className="w-full">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Candidate
                </Button>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => {}}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Resume
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {}}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Resume
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {}}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Cover Letter
                </Button>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea 
                  className="w-full h-24 p-3 border rounded-md resize-none"
                  placeholder="Add internal notes about this candidate..."
                />
                <Button size="sm" className="mt-2">
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Helper Functions

function getStatusVariant(status?: string) {
  switch (status) {
    case 'Applied':
      return 'default';
    case 'Screening':
      return 'secondary';
    case 'Interview':
      return 'outline';
    case 'Offer':
      return 'default';
    case 'Hired':
      return 'default';
    case 'Rejected':
      return 'destructive';
    case 'Withdrawn':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return `${Math.ceil(diffDays / 30)} months ago`;
}