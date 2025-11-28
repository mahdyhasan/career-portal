import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { jobsApi, applicationsApi } from '@/services/api';
import { Job, Application } from '@shared/api';
import { Plus, Briefcase, Users, TrendingUp, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [jobsResponse, appsResponse] = await Promise.all([
          jobsApi.getJobs(),
          applicationsApi.getApplications(),
        ]);

        setJobs(jobsResponse.data);
        setApplications(appsResponse.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = [
    {
      icon: Briefcase,
      label: 'Active Jobs',
      value: jobs.filter(j => j.isActive).length,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Users,
      label: 'Total Applications',
      value: applications.length,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: TrendingUp,
      label: 'Shortlisted',
      value: applications.filter(a => a.status?.name === 'UNDER_REVIEW').length,
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <ProtectedRoute requireRole="admin">
      <Layout>
        <div className="py-12 px-4">
          <div className="container mx-auto">
            {/* Page Header */}
            <div className="mb-12 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-3">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground text-lg">
                  Manage your job postings and candidate applications
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/admin/create-job')}
                className="gap-2"
              >
                <Plus size={20} />
                Post New Job
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="bg-white border border-border rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium mb-2">
                          {stat.label}
                        </p>
                        <p className="text-4xl font-bold text-foreground">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.color}`}>
                        <Icon size={24} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Jobs */}
              <div className="bg-white border border-border rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Recent Jobs</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/jobs')}
                  >
                    View All
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground text-sm">Loading...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase size={40} className="mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-muted-foreground">No jobs posted yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {jobs.slice(0, 5).map(job => (
                      <div
                        key={job.id}
                        className="p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/admin/jobs/${job.id}`)}
                      >
                        <h4 className="font-semibold text-foreground">{job.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {applications.filter(a => a.job_id === job.id).length} applications
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Applications */}
              <div className="bg-white border border-border rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Recent Applications</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/candidates')}
                  >
                    View All
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground text-sm">Loading...</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={40} className="mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-muted-foreground">No applications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {applications.slice(0, 5).map(app => (
                      <div
                        key={app.id}
                        className="p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {app.candidate?.email}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {app.candidate?.email}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                            {app.status?.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-12 bg-gradient-to-r from-primary to-blue-600 rounded-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/admin/create-job')}
                  className="justify-start gap-2"
                >
                  <Plus size={18} />
                  Post New Job
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/admin/candidates')}
                  className="justify-start gap-2"
                >
                  <Users size={18} />
                  Manage Candidates
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/admin/jobs')}
                  className="justify-start gap-2"
                >
                  <Briefcase size={18} />
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
