import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { applicationsApi, jobsApi } from '@/services/api';
import { Application, Job } from '@shared/api';
import { ArrowLeft, Search, Filter, Loader2 } from 'lucide-react';

// Define application status as string literals since that's what the UI expects
type ApplicationStatusString = 'applied' | 'shortlisted' | 'rejected' | 'waiting' | 'video_call' | 'interview' | 'offered';

export default function CandidateManagement() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusString | null>(null);
  const [jobFilter, setJobFilter] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const statuses: ApplicationStatusString[] = [
    'applied',
    'shortlisted',
    'rejected',
    'waiting',
    'video_call',
    'interview',
    'offered',
  ];

  const statusColors: Record<ApplicationStatusString, string> = {
    applied: 'bg-blue-100 text-blue-800',
    shortlisted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    waiting: 'bg-yellow-100 text-yellow-800',
    video_call: 'bg-purple-100 text-purple-800',
    interview: 'bg-orange-100 text-orange-800',
    offered: 'bg-green-100 text-green-800',
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [appsData, jobsData] = await Promise.all([
          applicationsApi.getApplications(),
          jobsApi.getJobs(),
        ]);

        setApplications(appsData.data);
        setJobs(jobsData.data);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleStatusChange = async (
    applicationId: number,
    newStatus: ApplicationStatusString
  ) => {
    try {
      setUpdatingId(applicationId);
      // Map status string to ID (this should be a proper mapping)
      const statusIdMap: Record<ApplicationStatusString, number> = {
        applied: 1,
        shortlisted: 2,
        rejected: 3,
        waiting: 4,
        video_call: 5,
        interview: 6,
        offered: 7,
      };

      const updated = await applicationsApi.updateApplicationStatus(applicationId, {
        status_id: statusIdMap[newStatus],
      });

      if (updated) {
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId ? { ...app, status_id: statusIdMap[newStatus] } : app
          )
        );
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter applications
  let filteredApps = applications;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredApps = filteredApps.filter(
      app =>
        (app.candidateName as string).toLowerCase().includes(query) ||
        (app.candidateEmail as string).toLowerCase().includes(query)
    );
  }

  if (statusFilter) {
    const statusIdMap: Record<ApplicationStatusString, number> = {
      applied: 1,
      shortlisted: 2,
      rejected: 3,
      waiting: 4,
      video_call: 5,
      interview: 6,
      offered: 7,
    };
    filteredApps = filteredApps.filter(app => app.status_id === statusIdMap[statusFilter]);
  }

  if (jobFilter) {
    filteredApps = filteredApps.filter(app => app.job_id === Number(jobFilter));
  }

  return (
    <ProtectedRoute requireRole="HiringManager">
      <Layout>
        <div className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Back Button */}
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all mb-8"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>

            {/* Page Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-3">
                Candidate Management
              </h1>
              <p className="text-muted-foreground text-lg">
                Review applications and update candidate statuses
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white border border-border rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={20} className="text-muted-foreground" />
                <h3 className="font-bold text-foreground">Filters</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
                    Search Candidate
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
                    Application Status
                  </label>
                  <select
                    value={statusFilter || ''}
                    onChange={(e) =>
                      setStatusFilter((e.target.value as ApplicationStatusString) || null)
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  >
                    <option value="">All Statuses</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status
                          .replace('_', ' ')
                          .split(' ')
                          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Filter */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
                    Job Position
                  </label>
                  <select
                    value={jobFilter || ''}
                    onChange={(e) => setJobFilter(e.target.value || null)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  >
                    <option value="">All Jobs</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading applications...</p>
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <p className="text-muted-foreground text-lg">
                    {searchQuery || statusFilter || jobFilter
                      ? 'No applications match your filters'
                      : 'No applications yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/50 border-b border-border">
                      <tr>
                        <th className="text-left px-6 py-3 font-semibold text-foreground text-sm">
                          Candidate
                        </th>
                        <th className="text-left px-6 py-3 font-semibold text-foreground text-sm">
                          Job
                        </th>
                        <th className="text-left px-6 py-3 font-semibold text-foreground text-sm">
                          Applied
                        </th>
                        <th className="text-left px-6 py-3 font-semibold text-foreground text-sm">
                          Status
                        </th>
                        <th className="text-left px-6 py-3 font-semibold text-foreground text-sm">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApps.map((app, idx) => {
                        // Convert status_id to readable status for display
                        const getStatusString = (statusId: number): ApplicationStatusString => {
                          const statusMap: Record<number, ApplicationStatusString> = {
                            1: 'applied',
                            2: 'shortlisted',
                            3: 'rejected',
                            4: 'waiting',
                            5: 'video_call',
                            6: 'interview',
                            7: 'offered',
                          };
                          return statusMap[statusId] || 'applied';
                        };

                        const currentStatus = getStatusString(app.status_id);

                        return (
                          <tr
                            key={app.id}
                            className={`border-b border-border hover:bg-secondary/20 transition-colors ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-secondary/5'
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {app.candidateName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {app.candidateEmail}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-foreground">
                                {jobs.find(j => j.id === app.job_id)?.title || 'Unknown Job'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-muted-foreground">
                                {new Date(app.created_at).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={statusColors[currentStatus]}>
                                {currentStatus
                                  .replace('_', ' ')
                                  .split(' ')
                                  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                  .join(' ')}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {updatingId === app.id ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 size={16} className="animate-spin" />
                                    Updating...
                                  </div>
                                ) : (
                                  <div className="relative group">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {}}
                                    >
                                      Update Status
                                    </Button>
                                    <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white border border-border rounded-lg shadow-lg z-10 min-w-[150px]">
                                      {statuses.map(status => (
                                        <button
                                          key={status}
                                          onClick={() => handleStatusChange(app.id, status)}
                                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                            currentStatus === status
                                              ? 'bg-primary/10 text-primary font-semibold'
                                              : 'text-foreground'
                                          }`}
                                        >
                                          {status
                                            .replace('_', ' ')
                                            .split(' ')
                                            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                            .join(' ')}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer Stats */}
              {!loading && filteredApps.length > 0 && (
                <div className="border-t border-border px-6 py-4 bg-secondary/30 flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">
                    Showing {filteredApps.length} of {applications.length} applications
                  </p>
                  <div className="flex gap-6 text-xs">
                    {statuses.map(status => {
                      const count = filteredApps.filter(
                        app => {
                          const appStatus = (() => {
                            const statusMap: Record<number, ApplicationStatusString> = {
                              1: 'applied',
                              2: 'shortlisted',
                              3: 'rejected',
                              4: 'waiting',
                              5: 'video_call',
                              6: 'interview',
                              7: 'offered',
                            };
                            return statusMap[app.status_id] || 'applied';
                          })();
                          return appStatus === status;
                        }
                      ).length;
                      return (
                        <div key={status}>
                          <span className="text-muted-foreground">
                            {status.replace('_', ' ')}: 
                          </span>
                          <span className="font-semibold text-foreground ml-1">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
