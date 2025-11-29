import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import SuperAdminLayout from '@/components/admin/SuperAdminLayout';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Mail, 
  Shield, 
  Bell, 
  Database, 
  Globe,
  Save,
  RefreshCw,
  Check,
  X
} from 'lucide-react';

interface SystemConfig {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    maxFileUploadSize: number;
    supportedFileTypes: string[];
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableEmailNotifications: boolean;
  };
  security: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecialChars: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    enableTwoFactor: boolean;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    enableSmsNotifications: boolean;
    newApplicationNotification: boolean;
    applicationStatusChangeNotification: boolean;
    systemMaintenanceNotification: boolean;
  };
  backup: {
    enableAutoBackup: boolean;
    backupFrequency: string;
    backupRetentionDays: number;
    backupLocation: string;
  };
}

const defaultConfig: SystemConfig = {
  general: {
    siteName: 'Augmex Career Portal',
    siteDescription: 'Find your dream job with us',
    contactEmail: 'admin@augmex.com',
    maxFileUploadSize: 10,
    supportedFileTypes: ['pdf', 'doc', 'docx', 'txt']
  },
  email: {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@augmex.com',
    fromName: 'Augmex Career Portal',
    enableEmailNotifications: true
  },
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    sessionTimeout: 120,
    maxLoginAttempts: 5,
    enableTwoFactor: false
  },
  notifications: {
    enableEmailNotifications: true,
    enablePushNotifications: false,
    enableSmsNotifications: false,
    newApplicationNotification: true,
    applicationStatusChangeNotification: true,
    systemMaintenanceNotification: true
  },
  backup: {
    enableAutoBackup: true,
    backupFrequency: 'daily',
    backupRetentionDays: 30,
    backupLocation: '/backups'
  }
};

export default function SystemConfig() {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    try {
      setSaving(true);
      // In real implementation, save to backend
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save system config:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    });
  };

  return (
    <ProtectedRoute requireRole="SuperAdmin">
      <SuperAdminLayout>
          <div className="py-8 px-4">
            <div className="container mx-auto max-w-4xl">
              {/* Page Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold text-foreground">System Configuration</h1>
                  </div>
                  <p className="text-muted-foreground text-lg">
                    Manage system settings and platform configuration
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  {saveStatus === 'success' && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Saved
                    </Badge>
                  )}
                  {saveStatus === 'error' && (
                    <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      Error
                    </Badge>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="backup" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Backup
                  </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general">
                  <Card>
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                      <CardDescription>
                        Basic platform configuration and general settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="siteName">Site Name</Label>
                          <Input
                            id="siteName"
                            value={config.general.siteName}
                            onChange={(e) => updateConfig('general', 'siteName', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactEmail">Contact Email</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            value={config.general.contactEmail}
                            onChange={(e) => updateConfig('general', 'contactEmail', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="siteDescription">Site Description</Label>
                        <Textarea
                          id="siteDescription"
                          value={config.general.siteDescription}
                          onChange={(e) => updateConfig('general', 'siteDescription', e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="maxFileUploadSize">Max File Upload Size (MB)</Label>
                          <Input
                            id="maxFileUploadSize"
                            type="number"
                            value={config.general.maxFileUploadSize}
                            onChange={(e) => updateConfig('general', 'maxFileUploadSize', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="supportedFileTypes">Supported File Types</Label>
                          <Input
                            id="supportedFileTypes"
                            value={config.general.supportedFileTypes.join(', ')}
                            onChange={(e) => updateConfig('general', 'supportedFileTypes', e.target.value.split(',').map(s => s.trim()))}
                            placeholder="pdf, doc, docx, txt"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Email Settings */}
                <TabsContent value="email">
                  <Card>
                    <CardHeader>
                      <CardTitle>Email Configuration</CardTitle>
                      <CardDescription>
                        SMTP settings and email notification preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableEmailNotifications">Enable Email Notifications</Label>
                        <Switch
                          id="enableEmailNotifications"
                          checked={config.email.enableEmailNotifications}
                          onCheckedChange={(checked) => updateConfig('email', 'enableEmailNotifications', checked)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="smtpHost">SMTP Host</Label>
                          <Input
                            id="smtpHost"
                            value={config.email.smtpHost}
                            onChange={(e) => updateConfig('email', 'smtpHost', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="smtpPort">SMTP Port</Label>
                          <Input
                            id="smtpPort"
                            type="number"
                            value={config.email.smtpPort}
                            onChange={(e) => updateConfig('email', 'smtpPort', parseInt(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="smtpUser">SMTP User</Label>
                          <Input
                            id="smtpUser"
                            value={config.email.smtpUser}
                            onChange={(e) => updateConfig('email', 'smtpUser', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="smtpPassword">SMTP Password</Label>
                          <Input
                            id="smtpPassword"
                            type="password"
                            value={config.email.smtpPassword}
                            onChange={(e) => updateConfig('email', 'smtpPassword', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fromEmail">From Email</Label>
                          <Input
                            id="fromEmail"
                            type="email"
                            value={config.email.fromEmail}
                            onChange={(e) => updateConfig('email', 'fromEmail', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fromName">From Name</Label>
                          <Input
                            id="fromName"
                            value={config.email.fromName}
                            onChange={(e) => updateConfig('email', 'fromName', e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Configuration</CardTitle>
                      <CardDescription>
                        Password policies and security settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-3">Password Requirements</h4>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                            <Input
                              id="passwordMinLength"
                              type="number"
                              value={config.security.passwordMinLength}
                              onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="passwordRequireUppercase">Require Uppercase Letters</Label>
                              <Switch
                                id="passwordRequireUppercase"
                                checked={config.security.passwordRequireUppercase}
                                onCheckedChange={(checked) => updateConfig('security', 'passwordRequireUppercase', checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="passwordRequireLowercase">Require Lowercase Letters</Label>
                              <Switch
                                id="passwordRequireLowercase"
                                checked={config.security.passwordRequireLowercase}
                                onCheckedChange={(checked) => updateConfig('security', 'passwordRequireLowercase', checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="passwordRequireNumbers">Require Numbers</Label>
                              <Switch
                                id="passwordRequireNumbers"
                                checked={config.security.passwordRequireNumbers}
                                onCheckedChange={(checked) => updateConfig('security', 'passwordRequireNumbers', checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="passwordRequireSpecialChars">Require Special Characters</Label>
                              <Switch
                                id="passwordRequireSpecialChars"
                                checked={config.security.passwordRequireSpecialChars}
                                onCheckedChange={(checked) => updateConfig('security', 'passwordRequireSpecialChars', checked)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Session Security</h4>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                            <Input
                              id="sessionTimeout"
                              type="number"
                              value={config.security.sessionTimeout}
                              onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                            <Input
                              id="maxLoginAttempts"
                              type="number"
                              value={config.security.maxLoginAttempts}
                              onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor="enableTwoFactor">Enable Two-Factor Authentication</Label>
                            <Switch
                              id="enableTwoFactor"
                              checked={config.security.enableTwoFactor}
                              onCheckedChange={(checked) => updateConfig('security', 'enableTwoFactor', checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Backup Settings */}
                <TabsContent value="backup">
                  <Card>
                    <CardHeader>
                      <CardTitle>Backup Configuration</CardTitle>
                      <CardDescription>
                        Automated backup settings and retention policies
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableAutoBackup">Enable Automatic Backup</Label>
                        <Switch
                          id="enableAutoBackup"
                          checked={config.backup.enableAutoBackup}
                          onCheckedChange={(checked) => updateConfig('backup', 'enableAutoBackup', checked)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="backupFrequency">Backup Frequency</Label>
                          <Select 
                            value={config.backup.backupFrequency} 
                            onValueChange={(value) => updateConfig('backup', 'backupFrequency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="backupRetentionDays">Retention Days</Label>
                          <Input
                            id="backupRetentionDays"
                            type="number"
                            value={config.backup.backupRetentionDays}
                            onChange={(e) => updateConfig('backup', 'backupRetentionDays', parseInt(e.target.value))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="backupLocation">Backup Location</Label>
                        <Input
                          id="backupLocation"
                          value={config.backup.backupLocation}
                          onChange={(e) => updateConfig('backup', 'backupLocation', e.target.value)}
                          placeholder="/backups"
                        />
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
