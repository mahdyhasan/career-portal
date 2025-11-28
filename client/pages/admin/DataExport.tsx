import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { adminApi } from '@/services/api';
import { 
  Download, 
  Database, 
  Users, 
  Briefcase, 
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ExportJob {
  id: string;
  type: 'users' | 'jobs' | 'applications';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName?: string;
  createdAt: string;
  completedAt?: string;
  fileSize?: string;
  downloadUrl?: string;
  recordCount?: number;
}

export default function DataExport() {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'users' | 'jobs' | 'applications'>('users');

  useEffect(() => {
    // In a real implementation, this would load export history from the database
    // For now, we'll use local state
  }, []);

  const handleExportData = async (type: 'users' | 'jobs' | 'applications') => {
    try {
      setLoading(true);
      const response = await adminApi.exportData(type);
      
      // Create and trigger download
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
        type: 'application/json' 
      });
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
    } finally {
      setLoading(false);
    }
  };

  const getExportIcon = (type: string) => {
    switch (type) {
      case 'users':
        return <Users className="h-8 w-8" />;
      case 'jobs':
        return <Briefcase className="h-8 w-8" />;
      case 'applications':
        return <FileText className="h-8 w-8" />;
      default:
        return <Database className="h-8 w-8" />;
    }
  };

  const getExportTitle = (type: string) => {
    switch (type) {
      case 'users':
        return 'User Data';
      case 'jobs':
        return 'Job Postings';
      case 'applications':
        return 'Applications';
      default:
        return 'Unknown';
    }
  };

  const getExportDescription = (type: string) => {
    switch (type) {
      case 'users':
        return 'Export all user accounts, roles, and profile information';
      case 'jobs':
        return 'Export all job postings, companies, and requirements';
      case 'applications':
        return 'Export all applications, statuses, and candidate information';
      default:
        return 'Export data';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportOptions = [
    {
      type: 'users' as const,
      title: 'User Data',
      description: 'Export all user accounts, roles, and profile information',
      fields: ['Email', 'Name', 'Role', 'Status', 'Created Date', 'Last Active']
    },
    {
      type: 'jobs' as const,
      title: 'Job Postings',
      description: 'Export all job postings, companies, and requirements',
      fields: ['Title', 'Company', 'Department', 'Status', 'Created Date', 'Salary Range']
    },
    {
      type: 'applications' as const,
      title: 'Applications',
      description: 'Export all applications, statuses, and candidate information',
      fields: ['Job Title', 'Candidate Email', 'Status', 'Applied Date', 'Last Updated']
    }
  ];

  return (
    <ProtectedRoute requireRole="SuperAdmin">
      <Layout>
        <div className="py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Download className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">Data Export</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Export system data for analysis and backup purposes
              </p>
            </div>

            {/* Export Options */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {exportOptions.map((option) => (
                <Card key={option.type} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        {getExportIcon(option.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{option.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {option.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Fields Preview */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Included Fields:</h4>
                        <div className="flex flex-wrap gap-1">
                          {option.fields.map((field) => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Export Button */}
                      <Button
                        onClick={() => handleExportData(option.type)}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Export {option.title}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Export History */}
            <div className="bg-white border border-border rounded-xl">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Export History</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  View and download previous export jobs
                </p>
              </div>

              <div className="p-6">
                {exportJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">No export history available</p>
                    <p className="text-sm text-muted-foreground">
                      Your export history will appear here once you start exporting data
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exportJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-secondary rounded-lg">
                            {getExportIcon(job.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">
                                {getExportTitle(job.type)}
                              </p>
                              {getStatusBadge(job.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Created: {formatDate(job.createdAt)}</span>
                              {job.completedAt && (
                                <span>Completed: {formatDate(job.completedAt)}</span>
                              )}
                              {job.recordCount && (
                                <span>Records: {job.recordCount.toLocaleString()}</span>
                              )}
                              {job.fileSize && (
                                <span>Size: {formatFileSize(Number(job.fileSize))}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          {job.downloadUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(job.downloadUrl, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Export Guidelines */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Export Guidelines</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Exports are generated in JSON format for easy integration with other systems</li>
                    <li>• Large datasets may take several minutes to process</li>
                    <li>• Export history is retained for 30 days</li>
                    <li>• Sensitive data is encrypted and follows data protection regulations</li>
                    <li>• For automated exports, consider setting up scheduled tasks</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
