import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DynamicFormBuilder } from '@/components/forms/DynamicFormBuilder';
import { jobsApi, lookupApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { JobFormField, Department, JobType, ExperienceLevel } from '@shared/api';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function CreateJobPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lookupLoading, setLookupLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Use's useAuth hook with proper ES import
  const { isAuthenticated, user, isLoading } = useAuth();

  // Lookup data - updated to match current database
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<ExperienceLevel[]>([]);
  const [jobStatuses, setJobStatuses] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [availableFormFields, setAvailableFormFields] = useState<any[]>([]); // Form fields from database

  // Fetch lookup data on component mount
  useEffect(() => {
    // Debug authentication state
    setDebugInfo(`isAuthenticated: ${isAuthenticated}, isLoading: ${isLoading}, user: ${JSON.stringify(user)}`);
    
    if (!isLoading && isAuthenticated) {
      const fetchLookupData = async () => {
        try {
          const [departmentsData, jobTypesData, experienceLevelsData, jobStatusesData, areasData, formFieldsData] = await Promise.all([
            lookupApi.getDepartments(),
            lookupApi.getJobTypes(),
            lookupApi.getExperienceLevels(),
            lookupApi.getJobStatuses(),
            lookupApi.getAreas(),
            lookupApi.getJobFormFields(), // Fetch form fields from database
          ]);

          setDepartments(departmentsData);
          setJobTypes(jobTypesData);
          setExperienceLevels(experienceLevelsData);
          setJobStatuses(jobStatusesData);
          setAreas(areasData);
          setAvailableFormFields(formFieldsData); // Set form fields from database
        } catch (err) {
          console.error('Failed to fetch lookup data:', err);
          setError('Failed to load form options');
        } finally {
          setLookupLoading(false);
        }
      };

      fetchLookupData();
    }
  }, [isAuthenticated, isLoading, user]);

  // Form fields are now empty by default - will be populated from database
  const [formFields, setFormFields] = useState<any[]>([]);

  // Initialize form with default values - updated to match database schema
  const [formData, setFormData] = useState({
    title: '',
    summary: '', // Changed from description to summary
    department_id: '',
    experience_level_id: '',
    job_type_id: '',
    status_id: '',
    area_id: '', // Changed from location_text to area_id
    salary_min: '', // Updated to match database field names
    salary_max: '', // Updated to match database field names
    responsibilities: '', // Changed from key_responsibilities
    requirements: '',
    benefits: '',
    deadline: '', // Added deadline field
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Job title is required';
    }
    
    if (!formData.summary.trim()) {
      errors.summary = 'Job summary is required';
    }
    
    if (!formData.department_id) {
      errors.department_id = 'Department is required';
    }
    
    if (!formData.experience_level_id) {
      errors.experience_level_id = 'Experience level is required';
    }
    
    if (!formData.job_type_id) {
      errors.job_type_id = 'Job type is required';
    }
    
    if (!formData.status_id) {
      errors.status_id = 'Status is required';
    }
    
    // area_id is optional in database, so no validation required
    
    // Validate salary range if provided
    if (formData.salary_min && formData.salary_max) {
      const min = parseFloat(formData.salary_min);
      const max = parseFloat(formData.salary_max);
      
      if (isNaN(min) || isNaN(max)) {
        errors.salary = 'Salary values must be numbers';
      } else if (min >= max) {
        errors.salary = 'Minimum salary must be less than maximum salary';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      setError('Please correct errors below');
      return;
    }

    if (!user) {
      setError('User information not available');
      return;
    }

    try {
      setLoading(true);

      // Prepare the job data with all required fields matching database schema
      const jobData = {
        title: formData.title.trim(),
        department_id: parseInt(formData.department_id),
        experience_level_id: parseInt(formData.experience_level_id),
        job_type_id: parseInt(formData.job_type_id),
        status_id: parseInt(formData.status_id),
        summary: formData.summary.trim(), // Changed from description
        responsibilities: formData.responsibilities
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
        salary_min: formData.salary_min || null, // Updated field names
        salary_max: formData.salary_max || null, // Updated field names
        deadline: formData.deadline || null, // Added deadline
        area_id: formData.area_id ? parseInt(formData.area_id) : null, // Updated from location_text
        form_fields: formFields.map(field => ({
          input_type: field.input_type, // Updated to match database
          label: field.label,
          is_required: field.is_required,
        })),
      };

      // Debug log the data being sent
      console.log('Creating job with data:', jobData);

      await jobsApi.createJob(jobData);

      setSubmitted(true);
    } catch (err) {
      console.error('Error creating job:', err);
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ProtectedRoute requireRole={["HiringManager", "SuperAdmin"]}>
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
    <ProtectedRoute requireRole={["HiringManager", "SuperAdmin"]}>
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

            {/* Debug Info - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Debug Info:</p>
                    <p>{debugInfo}</p>
                  </div>
                </div>
              </div>
            )}

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
                <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Form - Only show when authenticated and data is loaded */}
              {!isLoading && isAuthenticated && (
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
                          className={fieldErrors.title ? 'border-destructive' : ''}
                        />
                        {fieldErrors.title && (
                          <p className="text-destructive text-xs mt-1">{fieldErrors.title}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="summary" className="text-sm font-medium mb-2 block">
                          Job Summary *
                        </Label>
                        <Textarea
                          id="summary"
                          name="summary"
                          placeholder="Describe the job role, responsibilities, and what makes this position unique"
                          value={formData.summary}
                          onChange={handleChange}
                          rows={6}
                          disabled={loading}
                          className={fieldErrors.summary ? 'border-destructive' : ''}
                        />
                        {fieldErrors.summary && (
                          <p className="text-destructive text-xs mt-1">{fieldErrors.summary}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="area_id" className="text-sm font-medium mb-2 block">
                            Location
                          </Label>
                          <select
                            id="area_id"
                            name="area_id"
                            value={formData.area_id}
                            onChange={handleChange}
                            disabled={loading || lookupLoading}
                            className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.area_id ? 'border-destructive' : 'border-border'}`}
                          >
                            <option value="">Select location</option>
                            {areas.map((area) => (
                              <option key={area.id} value={area.id}>
                                {area.name}
                              </option>
                            ))}
                          </select>
                          {fieldErrors.area_id && (
                            <p className="text-destructive text-xs mt-1">{fieldErrors.area_id}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="deadline" className="text-sm font-medium mb-2 block">
                            Application Deadline
                          </Label>
                          <Input
                            id="deadline"
                            name="deadline"
                            type="date"
                            value={formData.deadline}
                            onChange={handleChange}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Job Status */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-6">Job Status</h3>
                    <div>
                      <Label htmlFor="status_id" className="text-sm font-medium mb-2 block">
                        Status *
                      </Label>
                      <select
                        id="status_id"
                        name="status_id"
                        value={formData.status_id}
                        onChange={handleChange}
                        disabled={loading || lookupLoading}
                        className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.status_id ? 'border-destructive' : 'border-border'}`}
                      >
                        <option value="">Select status</option>
                        {jobStatuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.status_id && (
                        <p className="text-destructive text-xs mt-1">{fieldErrors.status_id}</p>
                      )}
                    </div>
                  </div>

                  {/* Salary & Details */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-6">Salary & Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="salary_min" className="text-sm font-medium mb-2 block">
                            Salary Min
                          </Label>
                          <Input
                            id="salary_min"
                            name="salary_min"
                            placeholder="e.g., 100000"
                            value={formData.salary_min}
                            onChange={handleChange}
                            disabled={loading}
                            className={fieldErrors.salary ? 'border-destructive' : ''}
                          />
                        </div>

                        <div>
                          <Label htmlFor="salary_max" className="text-sm font-medium mb-2 block">
                            Salary Max
                          </Label>
                          <Input
                            id="salary_max"
                            name="salary_max"
                            placeholder="e.g., 150000"
                            value={formData.salary_max}
                            onChange={handleChange}
                            disabled={loading}
                            className={fieldErrors.salary ? 'border-destructive' : ''}
                          />
                        </div>
                      </div>
                      {fieldErrors.salary && (
                        <p className="text-destructive text-xs mt-1">{fieldErrors.salary}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="experience_level_id" className="text-sm font-medium mb-2 block">
                            Experience Required *
                          </Label>
                          <select
                            id="experience_level_id"
                            name="experience_level_id"
                            value={formData.experience_level_id}
                            onChange={handleChange}
                            disabled={loading || lookupLoading}
                            className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.experience_level_id ? 'border-destructive' : 'border-border'}`}
                          >
                            <option value="">Select experience level</option>
                            {experienceLevels.map((level) => (
                              <option key={level.id} value={level.id}>
                                {level.name}
                              </option>
                            ))}
                          </select>
                          {fieldErrors.experience_level_id && (
                            <p className="text-destructive text-xs mt-1">{fieldErrors.experience_level_id}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="department_id" className="text-sm font-medium mb-2 block">
                            Department *
                          </Label>
                          <select
                            id="department_id"
                            name="department_id"
                            value={formData.department_id}
                            onChange={handleChange}
                            disabled={loading || lookupLoading}
                            className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.department_id ? 'border-destructive' : 'border-border'}`}
                          >
                            <option value="">Select department</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                          {fieldErrors.department_id && (
                            <p className="text-destructive text-xs mt-1">{fieldErrors.department_id}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="job_type_id" className="text-sm font-medium mb-2 block">
                          Job Type *
                        </Label>
                        <select
                          id="job_type_id"
                          name="job_type_id"
                          value={formData.job_type_id}
                          onChange={handleChange}
                          disabled={loading || lookupLoading}
                          className={`w-full px-3 py-2 border rounded-lg ${fieldErrors.job_type_id ? 'border-destructive' : 'border-border'}`}
                        >
                          <option value="">Select job type</option>
                          {jobTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.job_type_id && (
                          <p className="text-destructive text-xs mt-1">{fieldErrors.job_type_id}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-6">Job Details</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="responsibilities" className="text-sm font-medium mb-2 block">
                          Key Responsibilities (one per line)
                        </Label>
                        <Textarea
                          id="responsibilities"
                          name="responsibilities"
                          placeholder="Design and implement features&#10;Collaborate with team members&#10;Code review"
                          value={formData.responsibilities}
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

                  {/* Application Form Fields - Now optional and from database */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-6">Application Form Fields</h3>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Select which form fields should be included in the application form for this job. These fields come from the database and can be managed in the Lookup Management section.
                      </p>
                      <DynamicFormBuilder
                        fields={formFields}
                        onChange={setFormFields}
                        availableFields={availableFormFields} // Pass available fields from database
                      />
                    </div>
                  </div>

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
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
