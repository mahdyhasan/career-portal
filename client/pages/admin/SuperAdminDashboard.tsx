import { useEffect, useState } from 'react';
import SuperAdminLayout from '@/components/admin/SuperAdminLayout';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Activity,
  TrendingUp,
  AlertCircle,
  Settings,
  Download,
  Eye,
  Plus,
  BarChart3,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  users: Array<{ role: string; count: number; active_count: number }>;
  jobs: Array<{ status: string; count: number }>;
  applications: Array<{ status: string; count: number }>;
  recentActivity: { new_users: number; new_jobs: number; new_applications: number };
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSystemStats() as any;
      setStats(response);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = stats?.users.reduce((sum, user) => sum + user.count, 0) || 0;
  const activeUsers = stats?.users.reduce((sum, user) => sum + user.active_count, 0) || 0;
  const totalJobs = stats?.jobs.reduce((sum, job) => sum + job.count, 0) || 0;
  const totalApplications = stats?.applications.reduce((sum, app) => sum + app.count, 0) || 0;

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="py-8 px-4">
          <div className="container mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-64 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-muted h-32 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="py-8 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Super Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Manage entire career portal system
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="px-3 py-1">
                  <Shield size={14} className="mr-1" />
                  Super Admin
                </Badge>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2"
                    onClick={() => navigate('/admin/create-job')}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Create Job</span>
                    <span className="text-xs text-muted-foreground">Post a new job opening</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2"
                    onClick={() => navigate('/admin/users')}
                  >
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Manage Users</span>
                    <span className="text-xs text-muted-foreground">Add, edit, deactivate users</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2"
                    onClick={() => navigate('/admin/jobs')}
                  >
                    <Briefcase className="h-5 w-5" />
                    <span className="font-medium">Job Management</span>
                    <span className="text-xs text-muted-foreground">Review and manage all jobs</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2"
                    onClick={() => navigate('/admin/applications')}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Applications</span>
                    <span className="text-xs text-muted-foreground">Review all applications</span>
                  </Button>
                  
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {activeUsers} active users
                </p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{stats?.recentActivity.new_users} this week
                  </Badge>
                </div>
  +++++++ REPLACE
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalJobs}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.jobs.find(j => j.status === 'Published')?.count || 0} published
                </p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    +{stats?.recentActivity.new_jobs} this week
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalApplications}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.applications.find(a => a.status === 'Under Review')?.count || 0} under review
                </p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    +{stats?.recentActivity.new_applications} this week
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Good</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
                <div className="mt-2">
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                    <Eye className="h-3 w-3 mr-1" />
                    Monitoring Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
                <CardDescription>Users by role and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.users.map((userStat) => (
                    <div key={userStat.role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm font-medium">{userStat.role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {userStat.active_count}/{userStat.count}
                        </span>
                        <Badge 
                          variant={userStat.active_count === userStat.count ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {Math.round((userStat.active_count / userStat.count) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Status</CardTitle>
                <CardDescription>Jobs by current status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.jobs.map((jobStat) => (
                    <div key={jobStat.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          jobStat.status === 'Published' ? 'bg-green-500' :
                          jobStat.status === 'Draft' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium">{jobStat.status}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {jobStat.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Pipeline</CardTitle>
                <CardDescription>Applications by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.applications.map((appStat) => (
                    <div key={appStat.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          appStat.status === 'Applied' ? 'bg-blue-500' :
                          appStat.status === 'Under Review' ? 'bg-yellow-500' :
                          appStat.status === 'Interview' ? 'bg-purple-500' :
                          appStat.status === 'Offer' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium">{appStat.status}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {appStat.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                System Alerts
              </CardTitle>
              <CardDescription>Important system notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No system alerts at this time</p>
                <p className="text-sm">All systems are operating normally</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
