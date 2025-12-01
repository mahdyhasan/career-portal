// client/pages/admin/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { jobsApi, applicationsApi, adminApi } from '@/services/api';
import { Job, Application } from '@shared/api';
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  Plus, 
  FileText, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  UserCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Type for dashboard stats
interface DashboardStats {
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  shortlistedApplications: number;
  hiredApplications: number;
  rejectedApplications: number;
  recentApplications: Application[];
  topSkills: { name: string; count: number }[];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    shortlistedApplications: 0,
    hiredApplications: 0,
    rejectedApplications: 0,
    recentApplications: [],
    topSkills: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load all data in parallel
        const [jobsResponse, applicationsResponse] = await Promise.all([
          jobsApi.getJobs(),
          applicationsApi.getApplications()
        ]);

        // Calculate stats from applications
        const applications = (Array.isArray(applicationsResponse.data) ? applicationsResponse.data : []) as Application[];
        const totalApplications = applications.length;
        const pendingApplications = applications.filter(app => app.status?.name === 'Applied').length;
        const shortlistedApplications = applications.filter(app => app.status?.name === 'Shortlisted').length;
        const hiredApplications = applications.filter(app => app.status?.name === 'Hired').length;
        const rejectedApplications = applications.filter(app => app.status?.name === 'Rejected').length;
        
        // Get recent applications (last 5)
        const recentApplications = applications
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        // Extract skills from candidates
        const skillsMap = new Map<string, number>();
        applications.forEach(app => {
          if (app.candidate && 'skills' in app.candidate && app.candidate.skills) {
            const skills = app.candidate.skills as any[];
            skills.forEach(skill => {
              const skillName = skill.skill?.name || '';
              if (skillName) {
                skillsMap.set(skillName, (skillsMap.get(skillName) || 0) + 1);
              }
            });
          }
        });
        
        // Convert to array and sort by count
        const topSkills = Array.from(skillsMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setStats({
          activeJobs: jobsResponse.data?.filter((job: Job) => job.isActive).length || 0,
          totalApplications,
          pendingApplications,
          shortlistedApplications,
          hiredApplications,
          rejectedApplications,
          recentApplications,
          topSkills
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Applied':
        return <Clock size={16} className="text-blue-500" />;
      case 'Shortlisted':
        return <UserCheck size={16} className="text-purple-500" />;
      case 'Interview':
        return <Calendar size={16} className="text-orange-500" />;
      case 'Hired':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'Rejected':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-100 text-blue-600';
      case 'Shortlisted':
        return 'bg-purple-100 text-purple-600';
      case 'Interview':
        return 'bg-orange-100 text-orange-600';
      case 'Hired':
        return 'bg-green-100 text-green-600';
      case 'Rejected':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ProtectedRoute requireRole={['SuperAdmin', 'HiringManager']}>
      <Layout>
        <div className="py-8 px-4">
          <div className="container mx-auto max-w-7xl">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground text-lg">
                Manage your job postings and track candidate applications
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={20} className="text-red-500 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Error loading dashboard</h3>
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-foreground">{stats.activeJobs}</div>
                  <p className="text-xs text-muted-foreground mt-1">Currently active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-foreground">{stats.totalApplications}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-foreground">{stats.pendingApplications}</div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Shortlisted</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-foreground">{stats.shortlistedApplications}</div>
                  <p className="text-xs text-muted-foreground mt-1">Under consideration</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Hired</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-foreground">{stats.hiredApplications}</div>
                  <p className="text-xs text-muted-foreground mt-1">Successfully hired</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Skills */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">Top Skills</CardTitle>
                <CardDescription>
                  Most requested skills from candidates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topSkills.length > 0 ? (
                    stats.topSkills.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">{index + 1}</span>
                          </div>
                          <span className="font-medium text-foreground">{skill.name}</span>
                        </div>
                        <Badge variant="secondary">{skill.count}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No skills data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Jobs */}
              <Card className="h-full">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-foreground">Recent Jobs</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/jobs')}
                  >
                    View All
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 size={40} className="animate-spin text-primary" />
                    </div>
                  ) : stats.activeJobs === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase size={40} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground">No active jobs</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {/* In a real implementation, you would fetch actual recent jobs */}
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className="p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                        >
                          <h4 className="font-semibold text-foreground">Sample Job Title {i}</h4>
                          <p className="text-sm text-muted-foreground mt-1">Sample company name</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {Math.floor(Math.random() * 10) + 1} applications
                            </span>
                            <Badge variant="outline">Active</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Applications */}
              <Card className="h-full">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-foreground">Recent Applications</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/candidates')}
                  >
                    View All
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 size={40} className="animate-spin text-primary" />
                    </div>
                  ) : stats.totalApplications === 0 ? (
                    <div className="text-center py-8">
                      <FileText size={40} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground">No applications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {stats.recentApplications.map(app => (
                        <div
                          key={app.id}
                          className="p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/admin/applications/${app.id}`)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-foreground">{app.job?.title}</h4>
                              <p className="text-sm text-muted-foreground">{app.job?.company?.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(app.status?.name || '')}
                              <Badge className={getStatusColor(app.status?.name || '')}>
                                {app.status?.name}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Applied on {formatDate(app.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-gradient-to-r from-primary to-blue-600 rounded-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-6 text-center">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/admin/create-job')}
                  className="justify-start gap-2 text-white bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50"
                >
                  <Plus size={20} />
                  Post New Job
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/admin/candidates')}
                  className="justify-start gap-2 text-white bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50"
                >
                  <Users size={20} />
                  Manage Candidates
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/admin/jobs')}
                  className="justify-start gap-2 text-white bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50"
                >
                  <Briefcase size={20} />
                  View All Jobs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
