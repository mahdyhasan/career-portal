// client/pages/candidate/ApplyJob.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { jobsApi } from '@/services/api';
import { Job } from '@shared/api';
import { MapPin, DollarSign, Briefcase, ArrowLeft, Loader2, Users, Settings, Eye } from 'lucide-react';

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isCandidate, isAdmin, isSuperAdmin } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJob = async () => {
      if (!id) {
        setError('Invalid job ID');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const data = await jobsApi.getJob(parseInt(id));
        setJob(data);
      } catch (error) {
        console.error('Failed to load job:', error);
        setError(error instanceof Error ? error.message : 'Failed to load job details');
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="py-12 px-4">
          <div className="container mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !job) {
    return (
      <Layout>
        <div className="py-12 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {error || 'Job Not Found'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error ? 'Please try again later or contact support if the problem persists.' : 'The job you\'re looking for doesn\'t exist or has been removed.'}
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft size={16} className="mr-2" />
              Back to Jobs
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isCandidate) {
      navigate(`/apply/${job.id}`);
    } else {
      // Non-candidate users get redirected to login with a message
      navigate('/login');
    }
  };

  const handleViewApplications = () => {
    navigate(`/admin/applications?job_id=${job.id}`);
  };

  const handleEditJob = () => {
    navigate(`/admin/jobs/${job.id}/edit`);
  };

  const handleManageJob = () => {
    navigate(`/admin/jobs`);
  };

  return (
    <Layout>
      <div className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all mb-8"
          >
            <ArrowLeft size={20} />
            Back to Jobs
          </button>

          {/* Job Header */}
          <div className="bg-white border border-border rounded-xl p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-3">
                  {job.title}
                </h1>
                <p className="text-xl text-muted-foreground">
                  {job.company?.name}
                </p>
              </div>
              <Badge className="px-4 py-2 text-base">
                {job.job_type?.name === 'Full-time' ? 'Full-time' : job.job_type?.name === 'Part-time' ? 'Part-time' : job.job_type?.name === 'Contract' ? 'Contract' : 'Internship'}
              </Badge>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-border">
              <div>
                <div className="flex items-center gap-3 text-muted-foreground mb-1">
                  <MapPin size={20} />
                  <span className="text-sm">Location</span>
                </div>
                <p className="text-foreground font-medium ml-8">{job.location_text}</p>
              </div>

              {job.salary_range && (
                <div>
                  <div className="flex items-center gap-3 text-muted-foreground mb-1">
                    <DollarSign size={20} />
                    <span className="text-sm">Salary Range</span>
                  </div>
                  <p className="text-foreground font-medium ml-8">{job.salary_range}</p>
                </div>
              )}

              {job.experience_level?.name && (
                <div>
                  <div className="flex items-center gap-3 text-muted-foreground mb-1">
                    <Briefcase size={20} />
                    <span className="text-sm">Experience</span>
                  </div>
                  <p className="text-foreground font-medium ml-8">{job.experience_level?.name}</p>
                </div>
              )}
            </div>

            {/* Action Buttons - Different for different user types */}
            <div className="flex flex-col sm:flex-row gap-4">
              {!isAuthenticated && (
                <Button
                  onClick={handleApplyClick}
                  size="lg"
                  className="flex-1"
                >
                  Apply Now
                  <ArrowLeft size={20} className="ml-2 rotate-180" />
                </Button>
              )}

              {isAuthenticated && isCandidate && (
                <Button
                  onClick={handleApplyClick}
                  size="lg"
                  className="flex-1"
                >
                  Apply Now
                  <ArrowLeft size={20} className="ml-2 rotate-180" />
                </Button>
              )}

              {isAuthenticated && (isAdmin || isSuperAdmin) && (
                <>
                  <Button
                    onClick={handleViewApplications}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <Users size={20} className="mr-2" />
                    View Applications
                  </Button>
                  <Button
                    onClick={handleEditJob}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <Settings size={20} className="mr-2" />
                    Edit Job
                  </Button>
                  <Button
                    onClick={handleManageJob}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <Eye size={20} className="mr-2" />
                    Manage Jobs
                  </Button>
                </>
              )}

              {isAuthenticated && !isCandidate && !isAdmin && !isSuperAdmin && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-1">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Only candidates can apply for jobs. If you're a hiring manager or admin, please use the admin panel to manage this job.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Description */}
              <section className="bg-white border border-border rounded-xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  About the Role
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </section>

              {/* Key Responsibilities */}
              {job.key_responsibilities && (
                <section className="bg-white border border-border rounded-xl p-8 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Key Responsibilities
                  </h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {job.key_responsibilities}
                  </p>
                </section>
              )}

              {/* Requirements */}
              {job.requirements && (
                <section className="bg-white border border-border rounded-xl p-8 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Requirements
                  </h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {job.requirements}
                  </p>
                </section>
              )}

              {/* Benefits */}
              {job.benefits && (
                <section className="bg-white border border-border rounded-xl p-8 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Benefits
                  </h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {job.benefits}
                  </p>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Application Form Fields Info */}
              {job.form_fields && job.form_fields.length > 0 && (
                <div className="bg-blue-50 border border-primary/20 rounded-xl p-6 sticky top-[100px]">
                  <h3 className="font-bold text-foreground mb-4">
                    Application Form
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You'll need to provide the following information:
                  </p>
                  <ul className="space-y-2">
                    {job.form_fields
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((field) => (
                        <li
                          key={field.id}
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                          {field.label}
                          {field.is_required && (
                            <span className="text-destructive font-bold">*</span>
                          )}
                        </li>
                      ))}
                  </ul>
                  {isCandidate && (
                    <Button
                      onClick={handleApplyClick}
                      className="w-full mt-6"
                    >
                      Apply Now
                    </Button>
                  )}
                  {!isAuthenticated && (
                    <Button
                      onClick={handleApplyClick}
                      className="w-full mt-6"
                    >
                      Apply Now
                    </Button>
                  )}
                  {isAuthenticated && (isAdmin || isSuperAdmin) && (
                    <Button
                      onClick={handleViewApplications}
                      variant="outline"
                      className="w-full mt-6"
                    >
                      <Users size={16} className="mr-2" />
                      View Applications
                    </Button>
                  )}
                </div>
              )}

              {/* Job Info Card */}
              <div className="bg-white border border-border rounded-xl p-6 mt-4">
                <div className="space-y-4">
                  {job.department && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Department
                      </p>
                      <p className="text-foreground font-medium mt-1">
                        {job.department?.name}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Posted On
                    </p>
                    <p className="text-foreground font-medium mt-1">
                      {new Date(job.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
