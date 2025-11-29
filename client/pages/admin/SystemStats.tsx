import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import SuperAdminLayout from '@/components/admin/SuperAdminLayout';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Briefcase, 
  FileText,
  Calendar,
  Activity,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';

interface SystemStats {
  users: Array<{ role: string; count: number; active_count: number }>;
  jobs: Array<{ status: string; count: number }>;
  applications: Array<{ status: string; count: number }>;
  recentActivity: { new_users: number; new_jobs: number; new_applications: number };
}

interface TimeRangeOption {
  value: string;
  label: string;
  days: number;
}

export default function SystemStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const timeRangeOptions: TimeRangeOption[] = [
    { value: '7', label: 'Last 7 days', days: 7 },
    { value: '30', label: 'Last 30 days', days: 30 },
    { value: '90', label: 'Last 90 days', days: 90 },
    { value: '365', label: 'Last year', days: 365 }
  ];

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSystemStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const getUserStats = () => {
    if (!stats?.users) return [];
    return stats.users.map(stat => ({
      role: stat.role,
      total: stat.count,
      active: stat.active_count,
      inactive: stat.count - stat.active_count
    }));
  };

  const getJobStats = () => {
    if (!stats?.jobs) return [];
    return stats.jobs.map(stat => ({
      status: stat.status,
      count: stat.count
    }));
  };

  const getApplicationStats = () => {
    if (!stats?.applications) return [];
    return stats.applications.map(stat => ({
      status: stat.status,
      count: stat.count
    }));
  };

  const getTotalUsers = () => {
    return stats?.users.reduce((total, user) => total + user.count, 0) || 0;
  };

  const getActiveUsers = () => {
    return stats?.users.reduce((total, user) => total + user.active_count, 0) || 0;
  };

  const getTotalJobs = () => {
    return stats?.jobs.reduce((total, job) => total + job.count, 0) || 0;
  };

  const getTotalApplications = () => {
    return stats?.applications.reduce((total, app) => total + app.count, 0) || 0;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SuperAdmin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HiringManager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Candidate':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'published':
        return 'text-green-600';
      case 'pending':
      case 'under review':
        return 'text-yellow-600';
      case 'inactive':
      case 'draft':
        return 'text-gray-600';
      case 'closed':
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  if (loading) {
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
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">System Statistics</h1>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Comprehensive overview of platform activity and performance
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Time Range Selector */}
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm"
                  >
                    {timeRangeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {/* Refresh Button */}
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getTotalUsers().toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {getActiveUsers().toLocaleString()} active ({Math.round((getActiveUsers() / getTotalUsers()) * 100)}%)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getTotalJobs().toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Active job postings on platform
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getTotalApplications().toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      All-time applications submitted
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {timeRangeOptions.find(opt => opt.value === timeRange)?.label}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        +{stats?.recentActivity.new_users || 0} new users
                      </p>
                      <p className="text-xs text-muted-foreground">
                        +{stats?.recentActivity.new_jobs || 0} new jobs
                      </p>
                      <p className="text-xs text-muted-foreground">
                        +{stats?.recentActivity.new_applications || 0} new applications
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* User Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      User Statistics by Role
                    </CardTitle>
                    <CardDescription>
                      Breakdown of users by role and activity status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getUserStats().map((userStat) => (
                        <div key={userStat.role} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge className={getRoleColor(userStat.role)}>
                              {userStat.role}
                            </Badge>
                            <div>
                              <p className="font-medium">{userStat.total.toLocaleString()} total</p>
                              <p className="text-sm text-muted-foreground">
                                {userStat.active} active, {userStat.inactive} inactive
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">{userStat.total}</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round((userStat.active / userStat.total) * 100)}% active
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Application Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Application Statistics by Status
                    </CardTitle>
                    <CardDescription>
                      Breakdown of applications by current status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getApplicationStats().map((appStat) => (
                        <div key={appStat.status} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(appStat.status)}`}></div>
                            <span className="font-medium capitalize">{appStat.status}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold">{appStat.count.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round((appStat.count / getTotalApplications()) * 100)}% of total
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Job Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Job Statistics by Status
                  </CardTitle>
                  <CardDescription>
                    Breakdown of job postings by current status
                  </CardDescription>
                </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getJobStats().map((jobStat) => (
                        <div key={jobStat.status} className="p-4 border border-border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium capitalize">{jobStat.status}</span>
                            <Badge className={getStatusColor(jobStat.status)}>
                              {jobStat.count}
                            </Badge>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getStatusColor(jobStat.status).replace('text-', 'bg-').replace('-600', '-500')}`}
                              style={{ width: `${(jobStat.count / getTotalJobs()) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.round((jobStat.count / getTotalJobs()) * 100)}% of all jobs
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
              </Card>
            </div>

            {/* Export Button */}
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => window.open('/admin/export', '_blank')}
              >
                <Download className="h-4 w-4" />
                Export Detailed Statistics
              </Button>
            </div>
          </div>
        </SuperAdminLayout>
    </ProtectedRoute>
  );
}
