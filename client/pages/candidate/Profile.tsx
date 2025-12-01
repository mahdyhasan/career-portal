// client/pages/candidate/Profile.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { candidateApi, applicationsApi, lookupApi } from '@/services/api';
import { Application, CandidateProfile, CandidateEducation, CandidateAchievement, Country, City, Area, Skill } from '@shared/api';
import { Edit2, Save, X, CheckCircle, Clock, XCircle, ArrowRight, Loader2, Trash2, Plus, FileText, Award, MapPin, Calendar, Briefcase, GraduationCap, Link as LinkIcon, Mail, Phone, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  
  // Data for dropdowns
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  
  // Error states for API calls
  const [countriesError, setCountriesError] = useState(false);
  const [applicationsError, setApplicationsError] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    blogUrl: '',
    countryId: 0,
    cityId: 0,
    areaId: 0,
    earliestJoinDate: '',
  });

  // Education state
  const [educationList, setEducationList] = useState<CandidateEducation[]>([]);
  const [educationForm, setEducationForm] = useState({
    institute_name: '',
    degree: '',
    major_subject: '',
    graduation_year: '',
    result: '',
  });
  const [editingEducationId, setEditingEducationId] = useState<number | null>(null);

  // Achievement state
  const [achievementList, setAchievementList] = useState<CandidateAchievement[]>([]);
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    description: '',
    issue_date: '',
    url: '',
  });
  const [editingAchievementId, setEditingAchievementId] = useState<number | null>(null);
  
  // Use a ref to track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Set up a cleanup function to mark the component as unmounted
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        
        // Load profile data first
        const profileData = await candidateApi.getMyProfile();
        
        if (isMountedRef.current && profileData) {
          setProfile(profileData as CandidateProfile);
          setFormData({
            firstName: profileData.first_name || '',
            lastName: profileData.last_name || '',
            email: profileData.user?.email || user.email || '',
            phone: profileData.phone || '',
            bio: profileData.bio || '',
            linkedinUrl: profileData.linkedin_url || '',
            githubUrl: profileData.github_url || '',
            portfolioUrl: profileData.portfolio_url || '',
            blogUrl: profileData.blog_url || '',
            countryId: profileData.country_id || 0,
            cityId: profileData.city_id || 0,
            areaId: profileData.area_id || 0,
            earliestJoinDate: profileData.earliest_join_date || '',
          });
          
          // Set education and achievement lists
          setEducationList(profileData.education || []);
          setAchievementList(profileData.achievements || []);
          
          // Set selected skills
          if (profileData.skills) {
            const candidateSkills = profileData.skills.map(cs => cs.skill).filter(Boolean) as Skill[];
            setSelectedSkills(candidateSkills);
          }
          
          // Load cities if country is selected
          if (profileData.country_id) {
            try {
              const citiesData = await lookupApi.getCities(profileData.country_id);
              if (isMountedRef.current) {
                setCities(Array.isArray(citiesData) ? citiesData : []);
                
                // Load areas if city is selected
                if (profileData.city_id) {
                  try {
                    const areasData = await lookupApi.getAreas(profileData.city_id);
                    if (isMountedRef.current) {
                      setAreas(Array.isArray(areasData) ? areasData : []);
                    }
                  } catch (areasErr) {
                    console.error('Failed to load areas:', areasErr);
                  }
                }
              }
            } catch (citiesErr) {
              console.error('Failed to load cities:', citiesErr);
            }
          }
        }

        // Load countries separately to avoid blocking profile loading
        try {
          const countriesData = await lookupApi.getCountries();
          if (isMountedRef.current) {
            setCountries(countriesData);
          }
        } catch (countriesErr) {
          console.error('Failed to load countries:', countriesErr);
          if (isMountedRef.current) {
            setCountriesError(true);
          }
        }

        // Load skills separately to avoid blocking profile loading
        try {
          const skillsData = await lookupApi.getSkills('', true);
          if (isMountedRef.current) {
            setSkills(Array.isArray(skillsData) ? skillsData : []);
          }
        } catch (skillsErr) {
          console.error('Failed to load skills:', skillsErr);
          if (isMountedRef.current) {
            setSkills([]); // Set empty array on error
          }
        }

        // Load applications separately to avoid blocking profile loading
        try {
          const applicationsData = await applicationsApi.getApplications({ candidate_user_id: user.id });
          if (isMountedRef.current) {
            // Handle different response structures for applications
            const applicationsResponse = applicationsData as any;
            const applicationsList = applicationsResponse?.applications || applicationsResponse?.data || [];
            setApplications(applicationsList);
          }
        } catch (appErr) {
          console.error('Failed to load applications:', appErr);
          if (isMountedRef.current) {
            setApplicationsError(true);
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [user?.id]);

  useEffect(() => {
    // Filter skills based on search
    if (skillSearch) {
      const filtered = skills.filter(skill => 
        skill.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
        !selectedSkills.some(selected => selected.id === skill.id)
      );
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills(skills.filter(skill => 
        !selectedSkills.some(selected => selected.id === skill.id)
      ));
    }
  }, [skillSearch, skills, selectedSkills]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Load cities when country changes
    if (name === 'countryId' && value) {
      const loadCities = async () => {
        try {
          const citiesData = await lookupApi.getCities(parseInt(value));
          if (isMountedRef.current) {
            setCities(citiesData);
            setAreas([]); // Reset areas when country changes
            setFormData(prev => ({ ...prev, cityId: 0, areaId: 0 }));
          }
        } catch (err) {
          console.error('Failed to load cities:', err);
        }
      };
      loadCities();
    }
    
    // Load areas when city changes
    if (name === 'cityId' && value) {
      const loadAreas = async () => {
        try {
          const areasData = await lookupApi.getAreas(parseInt(value));
          if (isMountedRef.current) {
            setAreas(areasData);
            setFormData(prev => ({ ...prev, areaId: 0 }));
          }
        } catch (err) {
          console.error('Failed to load areas:', err);
        }
      };
      loadAreas();
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      setError('');

      // Update basic profile info
      const updated = await candidateApi.updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        bio: formData.bio,
        earliest_join_date: formData.earliestJoinDate,
        country_id: formData.countryId ? parseInt(formData.countryId.toString()) : undefined,
        city_id: formData.cityId ? parseInt(formData.cityId.toString()) : undefined,
        area_id: formData.areaId ? parseInt(formData.areaId.toString()) : undefined,
        linkedin_url: formData.linkedinUrl,
        github_url: formData.githubUrl,
        portfolio_url: formData.portfolioUrl,
        blog_url: formData.blogUrl,
      });

      // Update skills
      // First, remove all existing skills
      const currentSkillIds = profile?.skills?.map(s => s.skill_id).filter(Boolean) || [];
      for (const skillId of currentSkillIds) {
        try {
          await candidateApi.removeSkill(skillId);
        } catch (err) {
          console.warn(`Failed to remove skill ${skillId}:`, err);
        }
      }
      
      // Then add all selected skills
      for (const skill of selectedSkills) {
        try {
          await candidateApi.addSkill({ skill_id: skill.id });
        } catch (err) {
          console.warn(`Failed to add skill ${skill.name}:`, err);
        }
      }

      if (isMountedRef.current) {
        setProfile(updated as CandidateProfile);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to save profile');
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleAddSkill = (skill: Skill) => {
    setSelectedSkills(prev => [...prev, skill]);
    setSkillSearch('');
  };

  const handleRemoveSkill = (skillId: number) => {
    setSelectedSkills(prev => prev.filter(skill => skill.id !== skillId));
  };

  const handleAddEducation = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      
      if (editingEducationId) {
        // Update existing education
        await candidateApi.updateEducation(editingEducationId, {
          ...educationForm,
          graduation_year: educationForm.graduation_year ? parseInt(educationForm.graduation_year) : undefined
        });
      } else {
        // Add new education
        await candidateApi.addEducation({
          ...educationForm,
          graduation_year: educationForm.graduation_year ? parseInt(educationForm.graduation_year) : undefined
        });
      }
      
      // Refresh profile data
      const profileData = await candidateApi.getMyProfile();
      if (isMountedRef.current) {
        setEducationList(profileData.education || []);
        
        // Reset form
        setEducationForm({
          institute_name: '',
          degree: '',
          major_subject: '',
          graduation_year: '',
          result: '',
        });
        setEditingEducationId(null);
        
        setSuccessMessage(editingEducationId ? 'Education updated successfully!' : 'Education added successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to save education');
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleEditEducation = (education: CandidateEducation) => {
    setEducationForm({
      institute_name: education.institute_name,
      degree: education.degree,
      major_subject: education.major_subject,
      graduation_year: education.graduation_year?.toString() || '',
      result: education.result || '',
    });
    setEditingEducationId(education.id);
  };

  const handleDeleteEducation = async (educationId: number) => {
    if (!user?.id) return;
    if (!window.confirm('Are you sure you want to delete this education record?')) {
      return;
    }

    try {
      setSaving(true);
      await candidateApi.deleteEducation(educationId);
      
      // Refresh education list
      const profileData = await candidateApi.getMyProfile();
      if (isMountedRef.current) {
        setEducationList(profileData.education || []);
        setSuccessMessage('Education deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to delete education');
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleAddAchievement = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      
      if (editingAchievementId) {
        // Update existing achievement
        await candidateApi.updateAchievement(editingAchievementId, {
          achievement_type_id: 1, // Default achievement type
          title: achievementForm.title,
          description: achievementForm.description,
          issue_date: achievementForm.issue_date,
          url: achievementForm.url,
        });
      } else {
        // Add new achievement
        await candidateApi.addAchievement({
          achievement_type_id: 1, // Default achievement type
          title: achievementForm.title,
          description: achievementForm.description,
          issue_date: achievementForm.issue_date,
          url: achievementForm.url,
        });
      }
      
      // Refresh profile data
      const profileData = await candidateApi.getMyProfile();
      if (isMountedRef.current) {
        setAchievementList(profileData.achievements || []);
        
        // Reset form
        setAchievementForm({
          title: '',
          description: '',
          issue_date: '',
          url: '',
        });
        setEditingAchievementId(null);
        
        setSuccessMessage(editingAchievementId ? 'Achievement updated successfully!' : 'Achievement added successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to save achievement');
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleEditAchievement = (achievement: CandidateAchievement) => {
    setAchievementForm({
      title: achievement.title,
      description: achievement.description || '',
      issue_date: achievement.issue_date || '',
      url: achievement.url || '',
    });
    setEditingAchievementId(achievement.id);
  };

  const handleDeleteAchievement = async (achievementId: number) => {
    if (!user?.id) return;
    if (!window.confirm('Are you sure you want to delete this achievement?')) {
      return;
    }

    try {
      setSaving(true);
      await candidateApi.deleteAchievement(achievementId);
      
      // Refresh achievement list
      const profileData = await candidateApi.getMyProfile();
      if (isMountedRef.current) {
        setAchievementList(profileData.achievements || []);
        setSuccessMessage('Achievement deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to delete achievement');
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
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
      case 'withdrawn':
        return <XCircle size={18} className="text-gray-500" />;
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
      withdrawn: 'Withdrawn',
    };
    return labels[status] || status;
  };

  const handleWithdrawApplication = async (applicationId: number) => {
    if (!user?.id) return;
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    try {
      await candidateApi.withdrawApplication(applicationId);
      
      // Refresh applications list
      try {
        const applicationsData = await applicationsApi.getApplications({ candidate_user_id: user.id });
        if (isMountedRef.current) {
          const applicationsResponse = applicationsData as any;
          const applicationsList = applicationsResponse?.applications || applicationsResponse?.data || [];
          setApplications(applicationsList);
          
          setSuccessMessage('Application withdrawn successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } catch (refreshErr) {
        console.error('Failed to refresh applications:', refreshErr);
        // Still show success message even if refresh fails
        if (isMountedRef.current) {
          setSuccessMessage('Application withdrawn successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to withdraw application');
      }
    }
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
        <div className="py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Page Header */}
            <div className="mb-8">
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

            {/* Profile Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="edit">Edit Profile</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Profile Card */}
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Profile
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('edit')}
                        >
                          <Edit2 size={16} />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-primary">
                            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {profile?.first_name} {profile?.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{profile?.user?.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {profile?.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={16} className="text-muted-foreground" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        
                        {profile?.country && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin size={16} className="text-muted-foreground" />
                            <span>
                              {profile.city?.name}, {profile.country.name}
                            </span>
                          </div>
                        )}
                        
                        {profile?.earliest_join_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar size={16} className="text-muted-foreground" />
                            <span>Available from {new Date(profile.earliest_join_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {profile?.bio && (
                        <div className="pt-4 border-t">
                          <p className="text-sm">{profile.bio}</p>
                        </div>
                      )}
                      
                      <div className="pt-4 border-t space-y-2">
                        {profile?.linkedin_url && (
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                            <LinkIcon size={16} />
                            LinkedIn
                          </a>
                        )}
                        {profile?.github_url && (
                          <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                            <LinkIcon size={16} />
                            GitHub
                          </a>
                        )}
                        {profile?.portfolio_url && (
                          <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                            <LinkIcon size={16} />
                            Portfolio
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skills Card */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Skills
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('edit')}
                        >
                          <Edit2 size={16} />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedSkills.map((skill) => (
                            <Badge key={skill.id} variant="secondary">
                              {skill.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No skills added yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Education Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Education
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('education')}
                      >
                        <Edit2 size={16} />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {educationList.length > 0 ? (
                      <div className="space-y-4">
                        {educationList.map((edu) => (
                          <div key={edu.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <GraduationCap size={20} className="text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{edu.degree} in {edu.major_subject}</h3>
                              <p className="text-sm text-muted-foreground">{edu.institute_name}</p>
                              {edu.graduation_year && (
                                <p className="text-sm text-muted-foreground">Graduated: {edu.graduation_year}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No education details added yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Achievements Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Achievements
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('education')}
                      >
                        <Edit2 size={16} />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {achievementList.length > 0 ? (
                      <div className="space-y-4">
                        {achievementList.map((achievement) => (
                          <div key={achievement.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Award size={20} className="text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{achievement.title}</h3>
                              {achievement.description && (
                                <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                              )}
                              {achievement.issue_date && (
                                <p className="text-sm text-muted-foreground">Issued: {new Date(achievement.issue_date).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No achievements added yet</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Edit Profile Tab */}
              <TabsContent value="edit" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal information and contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
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
                      <Label htmlFor="email">Email</Label>
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
                      <Label htmlFor="phone">Phone Number</Label>
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
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        disabled={saving}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="countryId">Country</Label>
                        {countriesError ? (
                          <div className="p-2 border rounded-md bg-amber-50 border-amber-200 text-amber-800 text-sm">
                            <div className="flex items-center gap-2">
                              <AlertCircle size={14} />
                              Failed to load countries
                            </div>
                          </div>
                        ) : (
                          <select
                            id="countryId"
                            name="countryId"
                            value={formData.countryId}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                            disabled={saving}
                          >
                            <option value={0}>Select Country</option>
                            {countries.map((country) => (
                              <option key={country.id} value={country.id}>
                                {country.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="cityId">City</Label>
                        <select
                          id="cityId"
                          name="cityId"
                          value={formData.cityId}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                          disabled={saving || cities.length === 0}
                        >
                          <option value={0}>Select City</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="areaId">Area</Label>
                        <select
                          id="areaId"
                          name="areaId"
                          value={formData.areaId}
                          onChange={handleChange}
                          className="w-full p-2 border rounded-md"
                          disabled={saving || areas.length === 0}
                        >
                          <option value={0}>Select Area</option>
                          {areas.map((area) => (
                            <option key={area.id} value={area.id}>
                              {area.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="earliestJoinDate">Earliest Available Date</Label>
                      <Input
                        id="earliestJoinDate"
                        name="earliestJoinDate"
                        type="date"
                        value={formData.earliestJoinDate}
                        onChange={handleChange}
                        disabled={saving}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Social Profiles</CardTitle>
                    <CardDescription>
                      Add links to your professional profiles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                      <Input
                        id="linkedinUrl"
                        name="linkedinUrl"
                        value={formData.linkedinUrl}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/yourprofile"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="githubUrl">GitHub URL</Label>
                      <Input
                        id="githubUrl"
                        name="githubUrl"
                        value={formData.githubUrl}
                        onChange={handleChange}
                        placeholder="https://github.com/yourprofile"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                      <Input
                        id="portfolioUrl"
                        name="portfolioUrl"
                        value={formData.portfolioUrl}
                        onChange={handleChange}
                        placeholder="https://yourportfolio.com"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="blogUrl">Blog URL</Label>
                      <Input
                        id="blogUrl"
                        name="blogUrl"
                        value={formData.blogUrl}
                        onChange={handleChange}
                        placeholder="https://yourblog.com"
                        disabled={saving}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                    <CardDescription>
                      Add your professional skills
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="skillSearch">Search Skills</Label>
                      <div className="relative">
                        <Input
                          id="skillSearch"
                          value={skillSearch}
                          onChange={(e) => setSkillSearch(e.target.value)}
                          placeholder="Search for skills..."
                          disabled={saving}
                        />
                        {filteredSkills.length > 0 && skillSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredSkills.map((skill) => (
                              <div
                                key={skill.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleAddSkill(skill)}
                              >
                                {skill.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Selected Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedSkills.map((skill) => (
                          <Badge key={skill.id} variant="secondary" className="flex items-center gap-1">
                            {skill.name}
                            <X
                              size={14}
                              className="cursor-pointer"
                              onClick={() => handleRemoveSkill(skill.id)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('overview')}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
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
                </div>
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                    <CardDescription>
                      Add your educational background
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="institute_name">Institution Name</Label>
                        <Input
                          id="institute_name"
                          name="institute_name"
                          value={educationForm.institute_name}
                          onChange={(e) => setEducationForm(prev => ({ ...prev, institute_name: e.target.value }))}
                          placeholder="University Name"
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <Label htmlFor="degree">Degree</Label>
                        <Input
                          id="degree"
                          name="degree"
                          value={educationForm.degree}
                          onChange={(e) => setEducationForm(prev => ({ ...prev, degree: e.target.value }))}
                          placeholder="Bachelor's, Master's, etc."
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="major_subject">Major Subject</Label>
                        <Input
                          id="major_subject"
                          name="major_subject"
                          value={educationForm.major_subject}
                          onChange={(e) => setEducationForm(prev => ({ ...prev, major_subject: e.target.value }))}
                          placeholder="Computer Science, etc."
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <Label htmlFor="graduation_year">Graduation Year</Label>
                        <Input
                          id="graduation_year"
                          name="graduation_year"
                          value={educationForm.graduation_year}
                          onChange={(e) => setEducationForm(prev => ({ ...prev, graduation_year: e.target.value }))}
                          placeholder="2020"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="result">Result/Grade</Label>
                      <Input
                        id="result"
                        name="result"
                        value={educationForm.result}
                        onChange={(e) => setEducationForm(prev => ({ ...prev, result: e.target.value }))}
                        placeholder="GPA, First Class, etc."
                        disabled={saving}
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      {editingEducationId && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingEducationId(null);
                            setEducationForm({
                              institute_name: '',
                              degree: '',
                              major_subject: '',
                              graduation_year: '',
                              result: '',
                            });
                          }}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button onClick={handleAddEducation} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            {editingEducationId ? 'Updating...' : 'Adding...'}
                          </>
                        ) : (
                          <>
                            <Plus size={16} className="mr-2" />
                            {editingEducationId ? 'Update Education' : 'Add Education'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Education History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {educationList.length > 0 ? (
                      <div className="space-y-4">
                        {educationList.map((edu) => (
                          <div key={edu.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-semibold">{edu.degree} in {edu.major_subject}</h3>
                              <p className="text-sm text-muted-foreground">{edu.institute_name}</p>
                              {edu.graduation_year && (
                                <p className="text-sm text-muted-foreground">Graduated: {edu.graduation_year}</p>
                              )}
                              {edu.result && (
                                <p className="text-sm text-muted-foreground">Result: {edu.result}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditEducation(edu)}
                                disabled={saving}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteEducation(edu.id)}
                                disabled={saving}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No education details added yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Achievements</CardTitle>
                    <CardDescription>
                      Add your achievements and certifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={achievementForm.title}
                        onChange={(e) => setAchievementForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Certification Name"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={achievementForm.description}
                        onChange={(e) => setAchievementForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the achievement"
                        rows={3}
                        disabled={saving}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="issue_date">Issue Date</Label>
                        <Input
                          id="issue_date"
                          name="issue_date"
                          type="date"
                          value={achievementForm.issue_date}
                          onChange={(e) => setAchievementForm(prev => ({ ...prev, issue_date: e.target.value }))}
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <Label htmlFor="url">URL</Label>
                        <Input
                          id="url"
                          name="url"
                          value={achievementForm.url}
                          onChange={(e) => setAchievementForm(prev => ({ ...prev, url: e.target.value }))}
                          placeholder="https://example.com/certificate"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      {editingAchievementId && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingAchievementId(null);
                            setAchievementForm({
                              title: '',
                              description: '',
                              issue_date: '',
                              url: '',
                            });
                          }}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button onClick={handleAddAchievement} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            {editingAchievementId ? 'Updating...' : 'Adding...'}
                          </>
                        ) : (
                          <>
                            <Plus size={16} className="mr-2" />
                            {editingAchievementId ? 'Update Achievement' : 'Add Achievement'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Achievement History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {achievementList.length > 0 ? (
                      <div className="space-y-4">
                        {achievementList.map((achievement) => (
                          <div key={achievement.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h3 className="font-semibold">{achievement.title}</h3>
                              {achievement.description && (
                                <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                              )}
                              {achievement.issue_date && (
                                <p className="text-sm text-muted-foreground">Issued: {new Date(achievement.issue_date).toLocaleDateString()}</p>
                              )}
                              {achievement.url && (
                                <a
                                  href={achievement.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  View Certificate
                                </a>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAchievement(achievement)}
                                disabled={saving}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAchievement(achievement.id)}
                                disabled={saving}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No achievements added yet</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>My Applications</CardTitle>
                    <CardDescription>
                      Track the status of your job applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {applicationsError ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                          <div>
                            <p className="text-sm text-amber-800 font-medium">Applications Unavailable</p>
                            <p className="text-xs text-amber-700 mt-1">
                              We couldn't load your applications. Please try again later.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : applications.length === 0 ? (
                      <div className="text-center py-12">
                        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No applications yet</h3>
                        <p className="text-muted-foreground mb-6">
                          You haven't applied to any jobs yet. Start browsing and apply to your first job!
                        </p>
                        <Button onClick={() => navigate('/jobs')}>
                          Browse Jobs
                          <ArrowRight size={16} className="ml-2" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {applications.map(app => (
                          <div key={app.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">
                                  {app.job?.title || 'Job Application'}
                                </h3>
                                <p className="text-muted-foreground">
                                  {app.job?.company?.name || 'Company'}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    {app.job?.location_text || 'Location'}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    Applied on {new Date(app.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(app.status?.name || '')}
                                  <span className="font-medium">
                                    {getStatusLabel(app.status?.name || '')}
                                  </span>
                                </div>
                                {app.status?.name !== 'withdrawn' && app.status?.name !== 'rejected' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleWithdrawApplication(app.id)}
                                    className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 size={14} className="mr-1" />
                                    Withdraw
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {app.history && app.history.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <h4 className="font-medium mb-2">Application History</h4>
                                <div className="space-y-2">
                                  {app.history.map((history, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm">
                                      <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                                      <div>
                                        <p className="font-medium">{history.notes || 'Status updated'}</p>
                                        <p className="text-muted-foreground">
                                          {new Date(history.created_at).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
