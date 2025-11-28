import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import SuperAdminNav from '@/components/admin/SuperAdminNav';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { adminApi } from '@/services/api';
import { User } from '@shared/api';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Activity, 
  Settings, 
  Download,
  TrendingUp,
  UserCheck,
  UserX,
  Eye,
  Shield,
  Database,
  Clock,
  ChevronRight
} from 'lucide-react';

interface SystemStats {
  users: Array<{ role: string; count: number; active_count: number }>;
  jobs: Array<{ status: string; count: number }>;
  applications: Array<{ status: string; count: number }>;
  recentActivity: { new_users: number; new_jobs: number; new_applications: number };
}

interface SystemConfig {
  database: { version: string; connection: string };
  server: { time: string; uptime: number };
  features: { [key: string]: boolean };
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, configResponse, usersResponse] = await Promise.all([
          adminApi.getSystemStats(),
          adminApi.getSystemConfig(),
          adminApi.getUsers(1, 5)
        ]);

        setSystemStats(statsResponse);
        setSystemConfig(configResponse);
        setRecentUsers(usersResponse.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getUserRoleStats = () => {
    if (!systemStats?.users) return [];
    return systemStats.users.map(stat => ({
      role: stat.role,
      total: stat.count,
      active: stat.active_count,
      inactive: stat.count - stat.active_count
    }));
  };

  const getJobStats = () => {
    if (!systemStats?.jobs) return [];
    return systemStats.jobs.map(stat => ({
      status: stat.status,
      count: stat.count
    }));
  };

  const getApplicationStats = () => {
    if (!systemStats?.applications) return [];
    return systemStats.applications.map(stat => ({
      status: stat.status,
      count: stat.count
    }));
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleExportData = async (type: 'users' | 'jobs' | 'applications') => {
    try {
      const response = await adminApi.exportData(type);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const quickActions = [
    {
      icon: Users,
      label: 'Manage Users',
      description: 'View and manage all system users',
      onClick: () => navigate('/admin/users'),
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Briefcase,
      label: 'Job Management',
      description: 'Manage job postings and applications',
      onClick: () => navigate('/admin/jobs'),
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: FileText,
      label: 'Application Review',
      description: 'Review and process applications',
      onClick: () => navigate('/admin/applications'),
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Activity,
      label: 'Audit Log',
      description: 'View system activity and changes',
      onClick: () => navigate('/admin/audit-log'),
      color: 'bg-orange-100 text-orange-600'
    },
    {
      icon: Settings,
      label: 'System Config',
      description: 'Configure system settings',
      onClick: () => navigate('/admin/config'),
      color: 'bg-gray-100 text-gray-600'
    },
    {
      icon: Database,
      label: 'Data Export',
      description: 'Export system data',
      onClick: () => navigate('/admin/export'),
      color: 'bg-indigo-100 text-indigo-600'
    }
  ];

  if (loading) {
    return (
      <ProtectedRoute requireRole="SuperAdmin">
        <div className="flex">
          <SuperAdminNav />
          <div className="flex-1">
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireRole="SuperAdmin">
      <div className="flex">
        <SuperAdminNav />
        <div className="flex-1">
          <div className="py-8 px-4">
            <div className="container mx-auto max-w-7xl">
              {/* Page Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
                </div>
                <p className="text-muted-foreground text-lg">
                  Complete system administration and management
                </p>
              </div>

              {/* System Status */}
              {systemConfig && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white border border-border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Database className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-foreground">Database</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      MySQL {systemConfig.database.version}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Connected</span>
                    </div>
                  </div>

                  <div className="bg-white border border-border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-foreground">Server Uptime</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {formatUptime(systemConfig.server.uptime)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(systemConfig.server.time).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-white border border-border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-foreground">Recent Activity</h3>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {systemStats?.recentActivity.new_users || 0} new users
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {systemStats?.recentActivity.new_jobs || 0} new jobs
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {systemStats?.recentActivity.new_applications || 0} new applications
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* User Statistics */}
                <div className="bg-white border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">User Statistics</h3>
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    {getUserRoleStats().map((stat) => (
                      <div key={stat.role} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{stat.role}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{stat.total}</span>
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">{stat.active}</span>
                          </div>
                          {stat.inactive > 0 && (
                            <div className="flex items-center gap-1">
                              <UserX className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-red-600">{stat.inactive}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Job Statistics */}
                <div className="bg-white border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Job Statistics</h3>
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    {getJobStats().map((stat) => (
                      <div key={stat.status} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{stat.status}</span>
                        <span className="text-sm font-medium">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Application Statistics */}
                <div className="bg-white border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Application Statistics</h3>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    {getApplicationStats().map((stat) => (
                      <div key={stat.status} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{stat.status}</span>
                        <span className="text-sm font-medium">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={action.onClick}
                        className="bg-white border border-border rounded-xl p-6 text-left hover:shadow-md transition-shadow group"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${action.color} group-hover:scale-105 transition-transform`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                              {action.label}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {action.description}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Users */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Recent Users</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/admin/users')}
                    >
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{user.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.role?.name} • Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.is_active ? (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <UserX className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                    {recentUsers.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No recent users</p>
                    )}
                  </div>
                </div>

                {/* Data Export Options */}
                <div className="bg-white border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Download className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Data Export</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { type: 'users' as const, label: 'Export All Users', description: 'Download user data as JSON' },
                      { type: 'jobs' as const, label: 'Export All Jobs', description: 'Download job postings data' },
                      { type: 'applications' as const, label: 'Export All Applications', description: 'Download application data' }
                    ].map((exportOption) => (
                      <button
                        key={exportOption.type}
                        onClick={() => handleExportData(exportOption.type)}
                        className="w-full text-left p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{exportOption.label}</p>
                            <p className="text-sm text-muted-foreground">{exportOption.description}</p>
                          </div>
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
