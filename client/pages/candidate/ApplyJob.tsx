import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DynamicApplicationForm } from '@/components/forms/DynamicApplicationForm';
import { useAuth } from '@/hooks/useAuth';
import { jobsApi, applicationsApi, candidateApi } from '@/services/api';
import { Job, CandidateProfile } from '@shared/api';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

export default function ApplyJobPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!jobId || !user?.id) return;
      try {
        setLoading(true);
        const [jobData, profileData] = await Promise.all([
          jobsApi.getJob(parseInt(jobId)),
          candidateApi.getMyProfile(),
        ]);

        if (!jobData) {
          setError('Job not found');
          return;
        }

        setJob(jobData);
        setCandidateProfile(profileData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [jobId, user?.id]);

  const handleSubmit = async (applicationData: Record<string, any>) => {
    if (!job || !user?.id) {
      setError('Missing job or user information');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Get user email from localStorage
      const userStr = localStorage.getItem('auth_user');
      const userData = userStr ? JSON.parse(userStr) : null;

      await applicationsApi.submitApplication({
        job_id: job.id,
        answers: Object.entries(applicationData).map(([key, value]) => ({
          job_form_field_id: parseInt(key),
          answer_text: String(value),
        })),
      });

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (!jobId) {
    return (
      <Layout>
        <div className="py-12 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Job not found</h1>
            <Button onClick={() => navigate('/jobs')}>Back to Jobs</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute requireRole="candidate">
      <Layout>
        <div className="py-12 px-4">
          <div className="container mx-auto max-w-3xl">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all mb-8"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading job details...</p>
              </div>
            ) : !job ? (
              <div className="bg-white border border-border rounded-xl p-8 text-center">
                <h1 className="text-2xl font-bold text-foreground mb-4">Job Not Found</h1>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => navigate('/jobs')}>Back to Jobs</Button>
              </div>
            ) : submitted ? (
              <div className="bg-white border border-border rounded-xl p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3">Application Submitted!</h1>
                <p className="text-muted-foreground text-lg mb-4">
                  Thank you for applying to {job.title} position at {job.company?.name}.
                </p>
                <p className="text-muted-foreground mb-8">
                  You can track your application status in your profile. We'll notify you as soon as we review your application.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => navigate('/profile')}>
                    View My Applications
                  </Button>
                  <Button onClick={() => navigate('/jobs')}>
                    Browse More Jobs
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-xl p-8">
                {/* Header */}
                <div className="mb-8 pb-8 border-b border-border">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Apply to {job.title}
                  </h1>
                  <p className="text-muted-foreground">
                    at {job.company?.name} • {job.location_text}
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-primary/20 rounded-lg p-4 mb-8">
                  <p className="text-sm text-foreground">
                    <strong>Note:</strong> Your profile will be updated with information you provide in this application. You can review and edit your profile at any time.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Application Form */}
                <DynamicApplicationForm
                  fields={job.form_fields}
                  onSubmit={handleSubmit}
                  isLoading={submitting}
                />
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
