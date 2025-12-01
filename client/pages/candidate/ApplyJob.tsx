// client/pages/candidate/ApplyJob.tsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DynamicApplicationForm } from '@/components/forms/DynamicApplicationForm';
import { useAuth } from '@/hooks/useAuth';
import { jobsApi, applicationsApi, candidateApi } from '@/services/api';
import { Job, CandidateProfile, CandidateProfileUpdateRequest } from '@shared/api';
import { ArrowLeft, CheckCircle, Loader2, Briefcase, MapPin, DollarSign, Calendar, Building, Users, Clock, AlertCircle } from 'lucide-react';

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
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationsError, setApplicationsError] = useState(false);
  
  // Use a ref to track if the component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Set up a cleanup function to mark the component as unmounted
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!jobId || !user?.id) return;
      try {
        setLoading(true);
        
        // First, get the job and profile data
        const [jobData, profileData] = await Promise.all([
          jobsApi.getJob(parseInt(jobId)),
          candidateApi.getMyProfile(),
        ]);

        if (!jobData) {
          setError('Job not found');
          return;
        }

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setJob(jobData);
          setCandidateProfile(profileData);
        }

        // Then, try to get applications data separately
        try {
          const applicationsData = await applicationsApi.getApplications({ candidate_user_id: user.id });
          
          // Check if already applied
          const applicationsResponse = applicationsData as any;
          const applicationsList = applicationsResponse?.applications || applicationsResponse?.data || [];
          const alreadyApplied = applicationsList.some((app: any) => app.job_id === parseInt(jobId));
          
          if (isMountedRef.current) {
            setHasApplied(alreadyApplied);
          }
        } catch (appErr) {
          console.warn('Failed to load applications:', appErr);
          // Don't fail the whole page if applications can't be loaded
          if (isMountedRef.current) {
            setApplicationsError(true);
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load job');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
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

      // Extract profile information from application data
      const profileUpdate: Partial<CandidateProfileUpdateRequest> = {};
      const answers: Array<{ job_form_field_id: number; answer_text?: string }> = [];

      Object.entries(applicationData).forEach(([key, value]) => {
        // Find the field by name (key is field.name)
        const field = job.form_fields?.find(f => f.name === key);
        
        if (field) {
          const fieldName = field.name.toLowerCase();
          
          // Map common field names to profile fields
          if (fieldName.includes('first') && fieldName.includes('name')) {
            profileUpdate.first_name = String(value);
          } else if (fieldName.includes('last') && fieldName.includes('name')) {
            profileUpdate.last_name = String(value);
          } else if (fieldName.includes('phone')) {
            profileUpdate.phone = String(value);
          } else if (fieldName.includes('bio') || fieldName.includes('cover')) {
            profileUpdate.bio = String(value);
          } else if (fieldName.includes('linkedin')) {
            profileUpdate.linkedin_url = String(value);
          } else if (fieldName.includes('github')) {
            profileUpdate.github_url = String(value);
          } else if (fieldName.includes('portfolio')) {
            profileUpdate.portfolio_url = String(value);
          } else {
            // Regular form field - use field.id
            answers.push({
              job_form_field_id: field.id,
              answer_text: String(value),
            });
          }
        }
      });

      // Update candidate profile if there are profile updates
      if (Object.keys(profileUpdate).length > 0) {
        try {
          await candidateApi.updateProfile(profileUpdate as CandidateProfileUpdateRequest);
        } catch (profileErr) {
          console.warn('Failed to update profile:', profileErr);
          // Don't fail the whole application if profile update fails
        }
      }

      // Submit the application
      await applicationsApi.submitApplication({
        job_id: job.id,
        answers,
      });

      if (isMountedRef.current) {
        setSubmitted(true);
        setHasApplied(true);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to submit application');
      }
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  if (!jobId) {
    return (
      <Layout>
        <div className="py-12 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Job not found</h1>
            <Button onClick={() => navigate('/')}>Back to Jobs</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute requireRole="Candidate">
      <Layout>
        <div className="py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all mb-6"
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
                <Button onClick={() => navigate('/')}>Back to Jobs</Button>
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
            ) : hasApplied ? (
              <div className="bg-white border border-border rounded-xl p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={32} className="text-blue-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3">Already Applied</h1>
                <p className="text-muted-foreground text-lg mb-4">
                  You have already applied to the {job.title} position at {job.company?.name}.
                </p>
                <p className="text-muted-foreground mb-8">
                  You can track your application status in your profile.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => navigate('/profile')}>
                    View My Applications
                  </Button>
                  <Button onClick={() => navigate('/')}>
                    Browse More Jobs
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Job Details */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-8">
                    <CardHeader>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Building size={16} />
                        {job.company?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-muted-foreground" />
                        {job.location_text}
                      </div>
                      
                      {job.salary_range && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign size={16} className="text-muted-foreground" />
                          {job.salary_range}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase size={16} className="text-muted-foreground" />
                        {job.job_type?.name}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Users size={16} className="text-muted-foreground" />
                        {job.experience_level?.name}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={16} className="text-muted-foreground" />
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Description</h4>
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {job.description}
                        </p>
                      </div>
                      
                      {job.requirements && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2">Requirements</h4>
                          <p className="text-sm text-muted-foreground line-clamp-4">
                            {job.requirements}
                          </p>
                        </div>
                      )}
                      
                      {job.benefits && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2">Benefits</h4>
                          <p className="text-sm text-muted-foreground line-clamp-4">
                            {job.benefits}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Application Form */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Application Form</CardTitle>
                      <CardDescription>
                        Please fill out the form below to apply for this position.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Enhanced Profile Section */}
                      {candidateProfile && (
                        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-lg">Your Current Profile</h4>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate('/profile')}
                              className="text-xs"
                            >
                              Edit Full Profile
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            {/* Basic Information */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-blue-800">Basic Information</h5>
                              <div><span className="font-medium">Name:</span> {candidateProfile.first_name || 'Not set'} {candidateProfile.last_name || ''}</div>
                              <div><span className="font-medium">Email:</span> {candidateProfile.user?.email}</div>
                              <div><span className="font-medium">Phone:</span> {candidateProfile.phone || 'Not set'}</div>
                            </div>
                            
                            {/* Location */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-blue-800">Location</h5>
                              <div><span className="font-medium">Country:</span> {candidateProfile.country?.name || 'Not set'}</div>
                              <div><span className="font-medium">City:</span> {candidateProfile.city?.name || 'Not set'}</div>
                              <div><span className="font-medium">Area:</span> {candidateProfile.area?.name || 'Not set'}</div>
                            </div>
                            
                            {/* Online Presence */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-blue-800">Online Presence</h5>
                              {candidateProfile.linkedin_url && (
                                <div><span className="font-medium">LinkedIn:</span> Available</div>
                              )}
                              {candidateProfile.github_url && (
                                <div><span className="font-medium">GitHub:</span> Available</div>
                              )}
                              {candidateProfile.portfolio_url && (
                                <div><span className="font-medium">Portfolio:</span> Available</div>
                              )}
                              {!candidateProfile.linkedin_url && !candidateProfile.github_url && !candidateProfile.portfolio_url && (
                                <div className="text-muted-foreground">No links provided</div>
                              )}
                            </div>
                          </div>
                          
                          {/* Skills Section */}
                          {candidateProfile.skills && candidateProfile.skills.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-blue-200">
                              <h5 className="font-medium text-blue-800 mb-2">Skills</h5>
                              <div className="flex flex-wrap gap-2">
                                {candidateProfile.skills.map((skill, index) => (
                                  <span 
                                    key={index} 
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                  >
                                    {skill.skill?.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Bio Section */}
                          {candidateProfile.bio && (
                            <div className="mt-4 pt-4 border-t border-blue-200">
                              <h5 className="font-medium text-blue-800 mb-2">Bio</h5>
                              <p className="text-sm text-blue-700 line-clamp-3">{candidateProfile.bio}</p>
                            </div>
                          )}
                          
                          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                            <p className="text-xs text-blue-800">
                              <strong>💡 Tip:</strong> Your profile information is used to pre-fill the application form. 
                              Any changes you make in the form will automatically update your profile for future applications.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Applications Error Warning */}
                      {applicationsError && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                            <div>
                              <p className="text-sm text-amber-800 font-medium">Application Status Unavailable</p>
                              <p className="text-xs text-amber-700 mt-1">
                                We couldn't check if you've already applied to this job. If you've applied before, please avoid duplicate applications.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-sm text-destructive">{error}</p>
                        </div>
                      )}

                      {/* Application Form */}
                      {job.form_fields && job.form_fields.length > 0 ? (
                        <DynamicApplicationForm
                          fields={job.form_fields}
                          onSubmit={handleSubmit}
                          isLoading={submitting}
                          candidateProfile={candidateProfile}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">
                            This job doesn't require additional application forms.
                          </p>
                          <Button 
                            onClick={() => {
                              // Submit without form fields
                              handleSubmit({});
                            }}
                            disabled={submitting}
                            className="w-full"
                          >
                            {submitting ? 'Submitting Application...' : 'Submit Application'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
