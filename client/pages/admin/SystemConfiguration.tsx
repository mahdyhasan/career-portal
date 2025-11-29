import { useEffect, useState } from 'react';
import SuperAdminLayout from '@/components/admin/SuperAdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  Database, 
  Server,
  Shield,
  Globe,
  Mail,
  Bell,
  Users,
  Download,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  Switch
} from "@/components/ui/switch";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface SystemConfig {
  database: {
    version: string;
    connection: string;
    size: string;
    backup_enabled: boolean;
    backup_frequency: string;
  };
  server: {
    version: string;
    uptime: number;
    environment: string;
    maintenance_mode: boolean;
  };
  features: {
    user_registration: boolean;
    email_notifications: boolean;
    job_auto_publish: boolean;
    application_tracking: boolean;
    audit_logging: boolean;
  };
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    from_email: string;
    from_name: string;
  };
  security: {
    password_min_length: number;
    session_timeout: number;
    max_login_attempts: number;
    two_factor_auth: boolean;
  };
}

export default function SystemConfiguration() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      // Mock data for now - will be replaced with actual API call
      const mockConfig: SystemConfig = {
        database: {
          version: 'MySQL 8.0.35',
          connection: 'Connected',
          size: '245 MB',
          backup_enabled: true,
          backup_frequency: 'daily'
        },
        server: {
          version: '1.0.0',
          uptime: 86400,
          environment: 'production',
          maintenance_mode: false
        },
        features: {
          user_registration: true,
          email_notifications: true,
          job_auto_publish: false,
          application_tracking: true,
          audit_logging: true
        },
        email: {
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          smtp_user: 'noreply@careerportal.com',
          from_email: 'noreply@careerportal.com',
          from_name: 'Career Portal'
        },
        security: {
          password_min_length: 8,
          session_timeout: 3600,
          max_login_attempts: 5,
          two_factor_auth: false
        }
      };
      setConfig(mockConfig);
    } catch (error) {
      console.error('Failed to load system config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Success would be handled here
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Success would be handled here
    } catch (error) {
      console.error('Failed to backup database:', error);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <ProtectedRoute requireRole="SuperAdmin">
        <SuperAdminLayout>
          <div className="py-8 px-4">
            <div className="container mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-64 mb-8"></div>
                <div className="bg-muted h-96 rounded-lg"></div>
              </div>
            </div>
          </div>
        </SuperAdminLayout>
      </ProtectedRoute>
    );
  }

  if (!config) {
    return (
      <ProtectedRoute requireRole="SuperAdmin">
        <SuperAdminLayout>
          <div className="py-8 px-4">
            <div className="container mx-auto">
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="text-lg font-semibold">Configuration Unavailable</h3>
                <p className="text-muted-foreground">Unable to load system configuration.</p>
              </div>
            </div>
          </div>
        </SuperAdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireRole="SuperAdmin">
      <SuperAdminLayout>
        <div className="py-8 px-4">
          <div className="container mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    System Configuration
                  </h1>
                  <p className="text-muted-foreground">
                    Manage system settings and configuration
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      Server Information
                    </CardTitle>
                    <CardDescription>
                      Current server status and information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Version</span>
                      <Badge variant="secondary">{config.server.version}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Environment</span>
                      <Badge 
                        variant={config.server.environment === 'production' ? 'default' : 'secondary'}
                        className={config.server.environment === 'production' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {config.server.environment}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Uptime</span>
                      <span className="text-sm text-muted-foreground">
                        {formatUptime(config.server.uptime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Maintenance Mode</span>
                      <Switch
                        checked={config.server.maintenance_mode}
                        onCheckedChange={(checked) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            server: { ...prev.server, maintenance_mode: checked }
                          } : prev)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      System Status
                    </CardTitle>
                    <CardDescription>
                      Overall system health status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">Database</div>
                          <div className="text-sm text-muted-foreground">
                            {config.database.connection}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">API Server</div>
                          <div className="text-sm text-muted-foreground">
                            Operational
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">Email Service</div>
                          <div className="text-sm text-muted-foreground">
                            Configured
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Database Settings */}
            <TabsContent value="database" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Configuration
                  </CardTitle>
                  <CardDescription>
                    Database connection and backup settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Database Version</label>
                      <Input value={config.database.version} disabled />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Database Size</label>
                      <Input value={config.database.size} disabled />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Enable Backups</div>
                        <div className="text-xs text-muted-foreground">
                          Automatically backup database
                        </div>
                      </div>
                      <Switch
                        checked={config.database.backup_enabled}
                        onCheckedChange={(checked) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            database: { ...prev.database, backup_enabled: checked }
                          } : prev)
                        }
                      />
                    </div>
                    
                    {config.database.backup_enabled && (
                      <div>
                        <label className="text-sm font-medium">Backup Frequency</label>
                        <Input
                          value={config.database.backup_frequency}
                          onChange={(e) => 
                            setConfig(prev => prev ? {
                              ...prev,
                              database: { ...prev.database, backup_frequency: e.target.value }
                            } : prev)
                          }
                          placeholder="daily, weekly, monthly"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleBackupDatabase}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Download size={16} />
                      Backup Database Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Settings */}
            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Configuration
                  </CardTitle>
                  <CardDescription>
                    SMTP settings for email notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">SMTP Host</label>
                      <Input
                        value={config.email.smtp_host}
                        onChange={(e) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            email: { ...prev.email, smtp_host: e.target.value }
                          } : prev)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">SMTP Port</label>
                      <Input
                        type="number"
                        value={config.email.smtp_port}
                        onChange={(e) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            email: { ...prev.email, smtp_port: parseInt(e.target.value) }
                          } : prev)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">SMTP Username</label>
                      <Input
                        value={config.email.smtp_user}
                        onChange={(e) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            email: { ...prev.email, smtp_user: e.target.value }
                          } : prev)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">From Email</label>
                      <Input
                        type="email"
                        value={config.email.from_email}
                        onChange={(e) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            email: { ...prev.email, from_email: e.target.value }
                          } : prev)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">From Name</label>
                    <Input
                      value={config.email.from_name}
                      onChange={(e) => 
                        setConfig(prev => prev ? {
                          ...prev,
                          email: { ...prev.email, from_name: e.target.value }
                        } : prev)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Configuration
                  </CardTitle>
                  <CardDescription>
                    Password and session security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Min Password Length</label>
                      <Input
                        type="number"
                        value={config.security.password_min_length}
                        onChange={(e) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            security: { ...prev.security, password_min_length: parseInt(e.target.value) }
                          } : prev)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Session Timeout (seconds)</label>
                      <Input
                        type="number"
                        value={config.security.session_timeout}
                        onChange={(e) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            security: { ...prev.security, session_timeout: parseInt(e.target.value) }
                          } : prev)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Login Attempts</label>
                      <Input
                        type="number"
                        value={config.security.max_login_attempts}
                        onChange={(e) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            security: { ...prev.security, max_login_attempts: parseInt(e.target.value) }
                          } : prev)
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Two-Factor Authentication</div>
                      <div className="text-xs text-muted-foreground">
                        Enable 2FA for enhanced security
                      </div>
                    </div>
                    <Switch
                      checked={config.security.two_factor_auth}
                      onCheckedChange={(checked) => 
                        setConfig(prev => prev ? {
                          ...prev,
                          security: { ...prev.security, two_factor_auth: checked }
                        } : prev)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Feature Settings */}
            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Feature Toggles
                  </CardTitle>
                  <CardDescription>
                    Enable or disable system features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">User Registration</div>
                        <div className="text-xs text-muted-foreground">
                          Allow new users to register
                        </div>
                      </div>
                      <Switch
                        checked={config.features.user_registration}
                        onCheckedChange={(checked) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            features: { ...prev.features, user_registration: checked }
                          } : prev)
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Email Notifications</div>
                        <div className="text-xs text-muted-foreground">
                          Send email notifications
                        </div>
                      </div>
                      <Switch
                        checked={config.features.email_notifications}
                        onCheckedChange={(checked) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            features: { ...prev.features, email_notifications: checked }
                          } : prev)
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Auto-Publish Jobs</div>
                        <div className="text-xs text-muted-foreground">
                          Automatically publish approved jobs
                        </div>
                      </div>
                      <Switch
                        checked={config.features.job_auto_publish}
                        onCheckedChange={(checked) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            features: { ...prev.features, job_auto_publish: checked }
                          } : prev)
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Application Tracking</div>
                        <div className="text-xs text-muted-foreground">
                          Track application status changes
                        </div>
                      </div>
                      <Switch
                        checked={config.features.application_tracking}
                        onCheckedChange={(checked) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            features: { ...prev.features, application_tracking: checked }
                          } : prev)
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Audit Logging</div>
                        <div className="text-xs text-muted-foreground">
                          Log all administrative actions
                        </div>
                      </div>
                      <Switch
                        checked={config.features.audit_logging}
                        onCheckedChange={(checked) => 
                          setConfig(prev => prev ? {
                            ...prev,
                            features: { ...prev.features, audit_logging: checked }
                          } : prev)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
        </SuperAdminLayout>
    </ProtectedRoute>
  );
}
