import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import SuperAdminLayout from '@/components/admin/SuperAdminLayout';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server, 
  Database, 
  HardDrive, 
  MemoryStick, 
  Activity,
  Cpu,
  Globe,
  Shield,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';

interface SystemInfo {
  server: {
    uptime: number;
    version: string;
    environment: string;
    nodeVersion: string;
    platform: string;
  };
  database: {
    status: 'connected' | 'disconnected' | 'error';
    size: string;
    tables: number;
    connections: number;
    lastBackup?: string;
  };
  storage: {
    total: number;
    used: number;
    available: number;
    usagePercentage: number;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    usagePercentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  network: {
    status: 'online' | 'offline';
    uptime: number;
    requests: {
      total: number;
      today: number;
      thisHour: number;
    };
  };
}

interface SystemLog {
  id: number;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: string;
  source: string;
}

export default function SystemManagement() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadSystemInfo();
    loadSystemLogs();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadSystemInfo();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSystemInfo = async () => {
    try {
      // In real implementation, this would call the actual API
      // For now, using mock data
      const mockSystemInfo: SystemInfo = {
        server: {
          uptime: 86400000 * 15, // 15 days
          version: '1.0.0',
          environment: 'production',
          nodeVersion: '18.17.0',
          platform: 'linux'
        },
        database: {
          status: 'connected',
          size: '2.4 GB',
          tables: 12,
          connections: 8,
          lastBackup: '2024-01-15T02:00:00Z'
        },
        storage: {
          total: 500, // GB
          used: 125.5, // GB
          available: 374.5, // GB
          usagePercentage: 25.1
        },
        memory: {
          total: 8192, // MB
          used: 4096, // MB
          available: 4096, // MB
          usagePercentage: 50
        },
        cpu: {
          usage: 35.5,
          cores: 4,
          model: 'Intel Xeon E5-2686 v4'
        },
        network: {
          status: 'online',
          uptime: 86400000 * 15,
          requests: {
            total: 1250000,
            today: 8500,
            thisHour: 350
          }
        }
      };

      setSystemInfo(mockSystemInfo);
    } catch (error) {
      console.error('Failed to load system info:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSystemLogs = async () => {
    try {
      // In real implementation, this would call the actual API
      // For now, using mock data
      const mockLogs: SystemLog[] = [
        {
          id: 1,
          level: 'info',
          message: 'System backup completed successfully',
          timestamp: '2024-01-15T10:30:00Z',
          source: 'backup-service'
        },
        {
          id: 2,
          level: 'warning',
          message: 'High memory usage detected',
          timestamp: '2024-01-15T10:15:00Z',
          source: 'monitoring'
        },
        {
          id: 3,
          level: 'info',
          message: 'New user registration: user@example.com',
          timestamp: '2024-01-15T10:00:00Z',
          source: 'auth-service'
        },
        {
          id: 4,
          level: 'error',
          message: 'Database connection timeout',
          timestamp: '2024-01-15T09:45:00Z',
          source: 'database'
        },
        {
          id: 5,
          level: 'info',
          message: 'Application deployed successfully',
          timestamp: '2024-01-15T09:30:00Z',
          source: 'deployment'
        }
      ];

      setSystemLogs(mockLogs);
    } catch (error) {
      console.error('Failed to load system logs:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSystemInfo(), loadSystemLogs()]);
  };

  const formatUptime = (milliseconds: number) => {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'debug':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'disconnected':
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'online':
        return <CheckCircle className="h-4 w-4" />;
      case 'disconnected':
      case 'offline':
        return <XCircle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
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
                  <Server className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">System Management</h1>
                </div>
                <p className="text-muted-foreground text-lg">
                  Monitor system performance and manage infrastructure
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
              </div>
            </div>

            {systemInfo && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value="database" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Logs
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Server Status</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Online
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Uptime: {formatUptime(systemInfo.server.uptime)}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Database</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(systemInfo.database.status)}>
                            {getStatusIcon(systemInfo.database.status)}
                            {systemInfo.database.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {systemInfo.database.connections} connections
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Storage</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {systemInfo.storage.used.toFixed(1)} GB
                        </div>
                        <p className="text-xs text-muted-foreground">
                          of {systemInfo.storage.total} GB used
                        </p>
                        <Progress value={systemInfo.storage.usagePercentage} className="mt-2" />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {systemInfo.cpu.usage.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {systemInfo.cpu.cores} cores
                        </p>
                        <Progress value={systemInfo.cpu.usage} className="mt-2" />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Server Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Version</p>
                            <p className="text-sm text-muted-foreground">{systemInfo.server.version}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Environment</p>
                            <p className="text-sm text-muted-foreground">{systemInfo.server.environment}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Node.js</p>
                            <p className="text-sm text-muted-foreground">{systemInfo.server.nodeVersion}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Platform</p>
                            <p className="text-sm text-muted-foreground">{systemInfo.server.platform}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Network Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Status</p>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(systemInfo.network.status)}>
                                {getStatusIcon(systemInfo.network.status)}
                                {systemInfo.network.status}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Total Requests</p>
                            <p className="text-sm text-muted-foreground">
                              {systemInfo.network.requests.total.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Today</p>
                            <p className="text-sm text-muted-foreground">
                              {systemInfo.network.requests.today.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">This Hour</p>
                            <p className="text-sm text-muted-foreground">
                              {systemInfo.network.requests.thisHour.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MemoryStick className="h-5 w-5" />
                          Memory Usage
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Used: {systemInfo.memory.used} MB</span>
                            <span>{systemInfo.memory.usagePercentage}%</span>
                          </div>
                          <Progress value={systemInfo.memory.usagePercentage} />
                          <div className="text-xs text-muted-foreground">
                            Total: {systemInfo.memory.total} MB | Available: {systemInfo.memory.available} MB
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <HardDrive className="h-5 w-5" />
                          Storage Usage
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Used: {systemInfo.storage.used.toFixed(1)} GB</span>
                            <span>{systemInfo.storage.usagePercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={systemInfo.storage.usagePercentage} />
                          <div className="text-xs text-muted-foreground">
                            Total: {systemInfo.storage.total} GB | Available: {systemInfo.storage.available.toFixed(1)} GB
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Cpu className="h-5 w-5" />
                          CPU Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Usage</p>
                            <div className="flex items-center gap-2">
                              <Progress value={systemInfo.cpu.usage} className="flex-1" />
                              <span className="text-sm">{systemInfo.cpu.usage.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Cores</p>
                            <p className="text-sm text-muted-foreground">{systemInfo.cpu.cores}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm font-medium">Model</p>
                            <p className="text-sm text-muted-foreground">{systemInfo.cpu.model}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Database Tab */}
                <TabsContent value="database">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="h-5 w-5" />
                          Database Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Status</p>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(systemInfo.database.status)}>
                                {getStatusIcon(systemInfo.database.status)}
                                {systemInfo.database.status}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Size</p>
                            <p className="text-sm text-muted-foreground">{systemInfo.database.size}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Tables</p>
                            <p className="text-sm text-muted-foreground">{systemInfo.database.tables}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Connections</p>
                            <p className="text-sm text-muted-foreground">{systemInfo.database.connections}</p>
                          </div>
                        </div>
                        
                        {systemInfo.database.lastBackup && (
                          <div>
                            <p className="text-sm font-medium">Last Backup</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(systemInfo.database.lastBackup).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Database Operations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Button className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Backup Database
                          </Button>
                          <Button variant="outline" className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Optimize Tables
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Logs Tab */}
                <TabsContent value="logs">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Logs</CardTitle>
                      <CardDescription>
                        Recent system events and activities
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {systemLogs.map((log) => (
                          <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border">
                            <Badge className={getLogLevelColor(log.level)}>
                              {log.level.toUpperCase()}
                            </Badge>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{log.message}</p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>{log.source}</span>
                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </SuperAdminLayout>
    </ProtectedRoute>
  );
}
