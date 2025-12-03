import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Briefcase, 
  Users, 
  FileText, 
  Settings, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Search,
  Filter,
  Calendar,
  MessageSquare,
  Bell,
  LogOut
} from 'lucide-react';
import { jobsApi } from '@/services/api';
import { Job, Application, User } from '@shared/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard data based on user role
      if (isSuperAdmin) {
        await loadSuperAdminData();
      } else if (isAdmin) {
        await loadAdminData();
      } else {
        await loadCandidateData();
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuperAdminData = async () => {
    try {
      // Get system-wide statistics
      const [jobs, applications, users] = await Promise.all([
        jobsApi.getJobs(1, 5),
        jobsApi.getApplications(1, 5),
        jobsApi.getUsers(1, 5)
      ]);

      setRecentJobs(jobs.data);
      setRecentApplications(applications.data);
      
      // Calculate statistics
      setStats({
        totalJobs: jobs.total,
        totalApplications: applications.total,
        totalUsers: users.total,
        activeJobs: jobs.data.filter(job => job.status?.name === 'Published').length,
        pendingApplications: applications.data.filter(app => app.status?.name === 'Applied').length
      });
    } catch (error) {
      console.error('Failed to load SuperAdmin data:', error);
    }
  };

  const loadAdminData = async () => {
    try {
      // Get admin-specific data (their jobs and applications)
      const [jobs, applications] = await Promise.all([
        jobsApi.getJobs(1, 5),
        jobsApi.getApplications(1, 5)
      ]);

      setRecentJobs(jobs.data);
      setRecentApplications(applications.data);
      
      setStats({
        totalJobs: jobs.total,
        totalApplications: applications.total,
        activeJobs: jobs.data.filter(job => job.status?.name === 'Published').length,
        pendingApplications: applications.data.filter(app => app.status?.name === 'Applied').length
      });
    } catch (error) {
      console.error('Failed to load Admin data:', error);
    }
  };

  const loadCandidateData = async () => {
    try {
      // Get candidate-specific data (their applications and profile)
      const [applications, profile] = await Promise.all([
        jobsApi.getApplications(1, 5),
        jobsApi.getProfile()
      ]);

      setRecentApplications(applications.data);
      
      // Calculate candidate-specific stats
      const totalApplications = applications.total;
      const completedApplications = applications.data.filter(app => 
        ['Offer', 'Hired'].includes(app.status?.name || '')
      ).length;
      const pendingApplications = applications.data.filter(app => 
        app.status?.name === 'Applied'
      ).length;

      setStats({
        totalApplications,
        completedApplications,
        pendingApplications,
        profileCompleteness: calculateProfileCompleteness(profile)
      });
    } catch (error) {
      console.error('Failed to load Candidate data:', error);
    }
  };

  const calculateProfileCompleteness = (profile: any) => {
    if (!profile) return 0;
    
    let completeness = 0;
    const totalFields = 8;
    
    if (profile.full_name) completeness++;
    if (profile.email) completeness++;
    if (profile.phone) completeness++;
    if (profile.linkedin_url) completeness++;
    if (profile.skills?.length > 0) completeness++;
    if (profile.education?.length > 0) completeness++;
    if (profile.experience?.length > 0) completeness++;
    if (profile.attachments?.length > 0) completeness++;
    
    return Math.round((completeness / totalFields) * 100);
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

  // Render different dashboard based on user role
  if (isSuperAdmin) {
    return <SuperAdminDashboard stats={stats} recentJobs={recentJobs} recentApplications={recentApplications} />;
  } else if (isAdmin) {
    return <AdminDashboard stats={stats} recentJobs={recentJobs} recentApplications={recentApplications} />;
  } else {
    return <CandidateDashboard stats={stats} recentApplications={recentApplications} />;
  }
}

// SuperAdmin Dashboard Component
function SuperAdminDashboard({ stats, recentJobs, recentApplications }: any) {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
          <p className="text-gray-600 mt-2">System-wide overview and management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Jobs" 
            value={stats.totalJobs || 0} 
            icon={Briefcase} 
            color="blue"
            onClick={() => navigate('/admin/jobs')}
          />
          <StatCard 
            title="Total Applications" 
            value={stats.totalApplications || 0} 
            icon={FileText} 
            color="green"
            onClick={() => navigate('/admin/applications')}
          />
          <StatCard 
            title="Active Jobs" 
            value={stats.activeJobs || 0} 
            icon={TrendingUp} 
            color="purple"
            onClick={() => navigate('/admin/jobs?status=published')}
          />
          <StatCard 
            title="Pending Applications" 
            value={stats.pendingApplications || 0} 
            icon={Clock} 
            color="orange"
            onClick={() => navigate('/admin/applications?status=applied')}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Latest job postings</CardDescription>
            </CardHeader>
            <CardContent>
              <JobList jobs={recentJobs} />
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest job applications</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationList applications={recentApplications} />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => navigate('/admin/create-job')} className="w-full">
              <Briefcase className="mr-2 h-4 w-4" />
              Create New Job
            </Button>
            <Button onClick={() => navigate('/admin/users')} className="w-full" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button onClick={() => navigate('/admin/settings')} className="w-full" variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Admin Dashboard Component
function AdminDashboard({ stats, recentJobs, recentApplications }: any) {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hiring Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your jobs and applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="My Jobs" 
            value={stats.totalJobs || 0} 
            icon={Briefcase} 
            color="blue"
            onClick={() => navigate('/jobs')}
          />
          <StatCard 
            title="Applications" 
            value={stats.totalApplications || 0} 
            icon={FileText} 
            color="green"
            onClick={() => navigate('/applications')}
          />
          <StatCard 
            title="Active Jobs" 
            value={stats.activeJobs || 0} 
            icon={TrendingUp} 
            color="purple"
            onClick={() => navigate('/jobs?status=published')}
          />
          <StatCard 
            title="Pending Reviews" 
            value={stats.pendingApplications || 0} 
            icon={Clock} 
            color="orange"
            onClick={() => navigate('/applications?status=applied')}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>My Jobs</CardTitle>
              <CardDescription>Your recent job postings</CardDescription>
            </CardHeader>
            <CardContent>
              <JobList jobs={recentJobs} isAdmin={true} />
            </CardContent>
          </Card>

          {/* Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest applications to your jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationList applications={recentApplications} isAdmin={true} />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => navigate('/create-job')} className="w-full">
              <Briefcase className="mr-2 h-4 w-4" />
              Post New Job
            </Button>
            <Button onClick={() => navigate('/applications')} className="w-full" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Review Applications
            </Button>
            <Button onClick={() => navigate('/analytics')} className="w-full" variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Candidate Dashboard Component
function CandidateDashboard({ stats, recentApplications }: any) {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header with Profile */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
            <p className="text-gray-600 mt-2">Manage your job search and applications</p>
          </div>
          
          {/* Profile Completeness */}
          <Card className="w-64">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Profile Completeness</span>
                <span className="text-sm text-gray-500">{stats.profileCompleteness || 0}%</span>
              </div>
              <Progress value={stats.profileCompleteness || 0} className="h-2" />
              {stats.profileCompleteness < 100 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={() => navigate('/profile')}
                >
                  Complete Profile
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Total Applications" 
            value={stats.totalApplications || 0} 
            icon={FileText} 
            color="blue"
            onClick={() => navigate('/applications')}
          />
          <StatCard 
            title="Pending Reviews" 
            value={stats.pendingApplications || 0} 
            icon={Clock} 
            color="orange"
            onClick={() => navigate('/applications?status=applied')}
          />
          <StatCard 
            title="Successful Applications" 
            value={stats.completedApplications || 0} 
            icon={CheckCircle} 
            color="green"
            onClick={() => navigate('/applications?status=offer')}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Your latest job applications</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationList applications={recentApplications} />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your job search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/jobs')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Browse Jobs
                </Button>
                <Button 
                  onClick={() => navigate('/profile')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Update Profile
                </Button>
                <Button 
                  onClick={() => navigate('/documents')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
                <Button 
                  onClick={() => navigate('/applications')} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Applications
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Jobs */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recommended Jobs</h2>
            <Button variant="outline" onClick={() => navigate('/jobs')}>
              View All Jobs
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600 text-center py-8">
                No recommended jobs available. Complete your profile to get personalized job recommendations.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

// Helper Components

function StatCard({ title, value, icon: Icon, color, onClick }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <Card 
      className={`${colorClasses[color]} cursor-pointer transition-all hover:shadow-md`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-8 w-8 opacity-60" />
        </div>
      </CardContent>
    </Card>
  );
}

function JobList({ jobs, isAdmin = false }: { jobs: Job[]; isAdmin?: boolean }) {
  const navigate = useNavigate();

  if (!jobs || jobs.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No jobs found. {isAdmin ? 'Create your first job posting.' : 'Check back later for new opportunities.'}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div 
          key={job.id} 
          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => navigate(`/jobs/${job.id}`)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{job.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {job.department?.name || 'No department'} • {job.job_type?.name || 'Not specified'}
              </p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {job.summary}
              </p>
            </div>
            <Badge 
              variant={job.status?.name === 'Published' ? 'default' : 'secondary'}
              className="ml-4"
            >
              {job.status?.name || 'Unknown'}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500">
              Posted {new Date(job.created_at).toLocaleDateString()}
            </span>
            <span className="text-xs text-gray-500">
              {job.location || 'Location not specified'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ApplicationList({ applications, isAdmin = false }: { applications: Application[]; isAdmin?: boolean }) {
  const navigate = useNavigate();

  if (!applications || applications.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No applications found.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((application) => (
        <div 
          key={application.id} 
          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => navigate(`/applications/${application.id}`)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {application.job?.title || 'Unknown Job'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isAdmin ? 
                  `${application.candidate?.full_name || 'Unknown Candidate'}` :
                  `${application.job?.department?.name || 'No department'}`
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Applied on {new Date(application.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge 
              variant={getStatusVariant(application.status?.name)}
              className="ml-4"
            >
              {application.status?.name || 'Unknown'}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

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