import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DynamicFormBuilder } from '@/components/forms/DynamicFormBuilder';
import { jobsApi } from '@/services/api';
import { JobFormField } from '@shared/api';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function CreateJobPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [formFields, setFormFields] = useState<any[]>([
    {
      id: 'field-1',
      name: 'resume',
      label: 'Upload Resume',
      type: 'file',
      required: true,
      order: 0,
    },
    {
      id: 'field-2',
      name: 'coverLetter',
      label: 'Cover Letter',
      type: 'textarea',
      required: true,
      placeholder: 'Tell us why you are interested in this position',
      order: 1,
    },
  ]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: 'Augmex',
    location: '',
    jobType: 'fulltime' as const,
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    department: '',
    experience: '',
    keyResponsibilities: '',
    requirements: '',
    benefits: '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.location || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      await jobsApi.createJob({
        title: formData.title,
        company_id: 1, // Default company ID, should be selectable
        department_id: 1, // Default department ID, should be selectable
        experience_level_id: 1, // Default experience level, should be selectable
        job_type_id: 1, // Default job type ID, should be selectable
        description: formData.description,
        key_responsibilities: formData.keyResponsibilities
          .split('\n')
          .map(r => r.trim())
          .filter(Boolean).join('\n'),
        requirements: formData.requirements
          .split('\n')
          .map(r => r.trim())
          .filter(Boolean).join('\n'),
        benefits: formData.benefits
          .split('\n')
          .map(b => b.trim())
          .filter(Boolean).join('\n'),
        salary_range: formData.salaryMin && formData.salaryMax 
          ? `$${formData.salaryMin} - $${formData.salaryMax}` 
          : undefined,
        location_text: formData.location,
        form_fields: formFields,
      });

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ProtectedRoute requireRole="admin">
        <Layout>
          <div className="py-12 px-4">
            <div className="container mx-auto max-w-2xl">
              <div className="bg-white border border-border rounded-xl p-12 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3">Job Posted!</h1>
                <p className="text-muted-foreground text-lg mb-8">
                  Your job posting is now live and candidates can start applying.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
                    Back to Dashboard
                  </Button>
                  <Button onClick={() => navigate('/admin/jobs')}>
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

  return (
    <ProtectedRoute requireRole="admin">
      <Layout>
        <div className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            {/* Back Button */}
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all mb-8"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>

            <div className="bg-white border border-border rounded-xl p-8">
              {/* Header */}
              <div className="mb-8 pb-8 border-b border-border">
                <h1 className="text-3xl font-bold text-foreground mb-2">Post a New Job</h1>
                <p className="text-muted-foreground">
                  Fill out the form below to create a new job posting
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Job Basics */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-6">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                        Job Title *
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="e.g., Senior React Developer"
                        value={formData.title}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                        Job Description *
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe the job role, responsibilities, and what makes this position unique"
                        value={formData.description}
                        onChange={handleChange}
                        rows={6}
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location" className="text-sm font-medium mb-2 block">
                          Location *
                        </Label>
                        <Input
                          id="location"
                          name="location"
                          placeholder="e.g., San Francisco, CA"
                          value={formData.location}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <Label htmlFor="jobType" className="text-sm font-medium mb-2 block">
                          Job Type
                        </Label>
                        <select
                          id="jobType"
                          name="jobType"
                          value={formData.jobType}
                          onChange={handleChange}
                          disabled={loading}
                          className="w-full px-3 py-2 border border-border rounded-lg"
                        >
                          <option value="fulltime">Full-time</option>
                          <option value="parttime">Part-time</option>
                          <option value="contract">Contract</option>
                          <option value="internship">Internship</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Salary & Details */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-6">Salary & Details</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="salaryMin" className="text-sm font-medium mb-2 block">
                          Salary Min
                        </Label>
                        <Input
                          id="salaryMin"
                          name="salaryMin"
                          type="number"
                          placeholder="e.g., 100000"
                          value={formData.salaryMin}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <Label htmlFor="salaryMax" className="text-sm font-medium mb-2 block">
                          Salary Max
                        </Label>
                        <Input
                          id="salaryMax"
                          name="salaryMax"
                          type="number"
                          placeholder="e.g., 150000"
                          value={formData.salaryMax}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <Label htmlFor="currency" className="text-sm font-medium mb-2 block">
                          Currency
                        </Label>
                        <Input
                          id="currency"
                          name="currency"
                          placeholder="USD"
                          value={formData.currency}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="experience" className="text-sm font-medium mb-2 block">
                          Experience Required
                        </Label>
                        <Input
                          id="experience"
                          name="experience"
                          placeholder="e.g., 5+ years"
                          value={formData.experience}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <Label htmlFor="department" className="text-sm font-medium mb-2 block">
                          Department
                        </Label>
                        <Input
                          id="department"
                          name="department"
                          placeholder="e.g., Engineering"
                          value={formData.department}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-6">Job Details</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="keyResponsibilities" className="text-sm font-medium mb-2 block">
                        Key Responsibilities (one per line)
                      </Label>
                      <Textarea
                        id="keyResponsibilities"
                        name="keyResponsibilities"
                        placeholder="Design and implement features&#10;Collaborate with team members&#10;Code review"
                        value={formData.keyResponsibilities}
                        onChange={handleChange}
                        rows={3}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <Label htmlFor="requirements" className="text-sm font-medium mb-2 block">
                        Requirements (one per line)
                      </Label>
                      <Textarea
                        id="requirements"
                        name="requirements"
                        placeholder="Strong TypeScript skills&#10;Experience with React&#10;Understanding of databases"
                        value={formData.requirements}
                        onChange={handleChange}
                        rows={3}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <Label htmlFor="benefits" className="text-sm font-medium mb-2 block">
                        Benefits (one per line)
                      </Label>
                      <Textarea
                        id="benefits"
                        name="benefits"
                        placeholder="Competitive salary&#10;Health insurance&#10;Remote work flexibility"
                        value={formData.benefits}
                        onChange={handleChange}
                        rows={3}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Builder */}
                <DynamicFormBuilder
                  fields={formFields}
                  onChange={setFormFields}
                />

                {/* Submit */}
                <div className="flex gap-4 pt-8 border-t border-border">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Creating Job...
                      </>
                    ) : (
                      'Post Job'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/admin/dashboard')}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
