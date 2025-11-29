import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { candidateApi, applicationsApi } from '@/services/api';
import { Application, CandidateProfile } from '@shared/api';
import { Edit2, Save, X, CheckCircle, Clock, XCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    resumeUrl: '',
    coverLetter: '',
    skills: '',
    experience: '',
    education: '',
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [profileData, applicationsData] = await Promise.all([
          candidateApi.getMyProfile(),
          applicationsApi.getApplications(1, 100),
        ]);

        if (profileData) {
          setProfile(profileData);
          setFormData({
            firstName: profileData.first_name || '',
            lastName: profileData.last_name || '',
            email: profileData.user?.email || user.email || '',
            phone: profileData.phone || '',
            resumeUrl: profileData.attachments?.find(a => a.file_type === 'CV')?.file_url || '',
            coverLetter: profileData.bio || '',
            skills: profileData.skills?.map(s => s.skill?.name).filter(Boolean).join(', ') || '',
            experience: '', // Experience not in CandidateProfile interface
            education: profileData.education?.map(e => `${e.degree} in ${e.major_subject} from ${e.institute_name}`).join('; ') || '',
          });
        }

        setApplications(applicationsData.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      setError('');
      const updated = await candidateApi.updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        bio: formData.coverLetter,
        // Note: skills, experience, education need to be handled separately via their respective APIs
      });

      setProfile(updated);
      setEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <Clock size={18} className="text-blue-500" />;
      case 'shortlisted':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'rejected':
        return <XCircle size={18} className="text-red-500" />;
      case 'video_call':
        return <CheckCircle size={18} className="text-purple-500" />;
      case 'interview':
        return <CheckCircle size={18} className="text-orange-500" />;
      case 'offered':
        return <CheckCircle size={18} className="text-green-600" />;
      default:
        return <Clock size={18} className="text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      applied: 'Applied',
      shortlisted: 'Shortlisted',
      rejected: 'Rejected',
      waiting: 'Waiting',
      video_call: 'Video Call',
      interview: 'Interview',
      offered: 'Offered',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <ProtectedRoute requireRole="Candidate">
        <Layout>
          <div className="py-12 px-4">
            <div className="container mx-auto text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your profile...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireRole="Candidate">
      <Layout>
        <div className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Page Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-3">My Profile</h1>
              <p className="text-muted-foreground text-lg">
                Manage your profile and track your job applications
              </p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
                ✓ {successMessage}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                ✗ {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-border rounded-xl p-8 sticky top-[100px]">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Profile</h2>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <Edit2 size={18} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>

                  {/* Profile Summary */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Name
                      </p>
                      <p className="text-foreground font-medium">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                        Email
                      </p>
                      <p className="text-foreground font-medium text-sm break-all">
                        {profile?.user?.email || user?.email}
                      </p>
                    </div>
                    {profile?.phone && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                          Phone
                        </p>
                        <p className="text-foreground font-medium">{profile.phone}</p>
                      </div>
                    )}
                    {profile?.skills && profile.skills.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                          Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skillObj, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skillObj.skill?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full mt-8"
                    onClick={() => navigate('/jobs')}
                  >
                    Browse Jobs
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                {editing ? (
                  // Edit Profile Form
                  <div className="bg-white border border-border rounded-xl p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-6">Edit Profile</h2>

                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName" className="text-sm font-medium mb-2 block">
                            First Name
                          </Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="text-sm font-medium mb-2 block">
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-sm font-medium mb-2 block">
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium mb-2 block">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1-555-0123"
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <Label htmlFor="resumeUrl" className="text-sm font-medium mb-2 block">
                          Resume URL
                        </Label>
                        <Input
                          id="resumeUrl"
                          name="resumeUrl"
                          value={formData.resumeUrl}
                          onChange={handleChange}
                          placeholder="https://example.com/resume.pdf"
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <Label htmlFor="skills" className="text-sm font-medium mb-2 block">
                          Skills (comma-separated)
                        </Label>
                        <Input
                          id="skills"
                          name="skills"
                          value={formData.skills}
                          onChange={handleChange}
                          placeholder="React, TypeScript, Node.js"
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <Label htmlFor="experience" className="text-sm font-medium mb-2 block">
                          Experience
                        </Label>
                        <Textarea
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleChange}
                          placeholder="5 years in web development..."
                          rows={3}
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <Label htmlFor="education" className="text-sm font-medium mb-2 block">
                          Education
                        </Label>
                        <Input
                          id="education"
                          name="education"
                          value={formData.education}
                          onChange={handleChange}
                          placeholder="B.S. Computer Science"
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <Label htmlFor="coverLetter" className="text-sm font-medium mb-2 block">
                          Cover Letter
                        </Label>
                        <Textarea
                          id="coverLetter"
                          name="coverLetter"
                          value={formData.coverLetter}
                          onChange={handleChange}
                          placeholder="Tell us about yourself..."
                          rows={4}
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1"
                      >
                        {saving ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} className="mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                        className="flex-1"
                      >
                        <X size={16} className="mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Applications List
                  <div>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        My Applications
                      </h2>
                      <p className="text-muted-foreground">
                        {applications.length} application{applications.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {applications.length === 0 ? (
                      <div className="bg-white border border-border rounded-xl p-12 text-center">
                        <p className="text-muted-foreground text-lg mb-6">
                          You haven't applied to any jobs yet.
                        </p>
                        <Button onClick={() => navigate('/jobs')}>
                          Browse Jobs
                          <ArrowRight size={16} className="ml-2" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {applications.map(app => (
                          <div
                            key={app.id}
                            className="bg-white border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-bold text-foreground text-lg">
                                  {app.job?.title || 'Job Application'}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Applied on{' '}
                                  {new Date(app.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(app.status?.name || '')}
                                  <span className="font-semibold text-sm text-foreground">
                                    {getStatusLabel(app.status?.name || '')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {app.history && app.history.length > 0 && (
                              <div className="mt-4 p-3 bg-secondary/50 rounded-lg border border-border">
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                                  Latest Notes
                                </p>
                                <p className="text-sm text-foreground">
                                  {app.history[app.history.length - 1]?.notes || 'No notes available'}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
