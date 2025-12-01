import { useState, useEffect } from 'react';
import { JobFormField, CandidateProfile } from '@shared/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertCircle, Upload } from 'lucide-react';

interface DynamicApplicationFormProps {
  fields: JobFormField[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  isLoading?: boolean;
  candidateProfile?: CandidateProfile | null;
}

export function DynamicApplicationForm({
  fields,
  onSubmit,
  isLoading = false,
  candidateProfile = null,
}: DynamicApplicationFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach(field => {
      // Pre-fill with profile data if available
      if (candidateProfile) {
        const fieldName = field.name.toLowerCase();
        
        // Map form fields to profile data
        if (fieldName.includes('first') && fieldName.includes('name')) {
          initial[field.name] = candidateProfile.first_name || '';
        } else if (fieldName.includes('last') && fieldName.includes('name')) {
          initial[field.name] = candidateProfile.last_name || '';
        } else if (fieldName.includes('phone')) {
          initial[field.name] = candidateProfile.phone || '';
        } else if (fieldName.includes('bio') || fieldName.includes('cover')) {
          initial[field.name] = candidateProfile.bio || '';
        } else if (fieldName.includes('linkedin')) {
          initial[field.name] = candidateProfile.linkedin_url || '';
        } else if (fieldName.includes('github')) {
          initial[field.name] = candidateProfile.github_url || '';
        } else if (fieldName.includes('portfolio')) {
          initial[field.name] = candidateProfile.portfolio_url || '';
        } else {
          initial[field.name] = '';
        }
      } else {
        initial[field.name] = '';
      }
    });
    return initial;
  });

  // Update form data when profile changes
  useEffect(() => {
    if (candidateProfile) {
      const updatedData: Record<string, any> = {};
      fields.forEach(field => {
        const fieldName = field.name.toLowerCase();
        
        // Map form fields to profile data
        if (fieldName.includes('first') && fieldName.includes('name')) {
          updatedData[field.name] = candidateProfile.first_name || '';
        } else if (fieldName.includes('last') && fieldName.includes('name')) {
          updatedData[field.name] = candidateProfile.last_name || '';
        } else if (fieldName.includes('phone')) {
          updatedData[field.name] = candidateProfile.phone || '';
        } else if (fieldName.includes('bio') || fieldName.includes('cover')) {
          updatedData[field.name] = candidateProfile.bio || '';
        } else if (fieldName.includes('linkedin')) {
          updatedData[field.name] = candidateProfile.linkedin_url || '';
        } else if (fieldName.includes('github')) {
          updatedData[field.name] = candidateProfile.github_url || '';
        } else if (fieldName.includes('portfolio')) {
          updatedData[field.name] = candidateProfile.portfolio_url || '';
        } else {
          // Keep existing value for non-profile fields
          updatedData[field.name] = formData[field.name] || '';
        }
      });
      setFormData(updatedData);
    }
  }, [candidateProfile, fields]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.name];
      
      // Required field validation
      if (field.is_required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        newErrors[field.name] = `${field.label} is required`;
      }
      
      // Email validation
      if (field.input_type?.name === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.name] = `${field.label} must be a valid email address`;
        }
      }
      
      // Phone validation (basic)
      if (field.input_type?.name === 'phone' && value) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value)) {
          newErrors[field.name] = `${field.label} must contain only valid phone number characters`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit application'
      );
    }
  };

  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {submitError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3">
          <AlertCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      {/* Form Fields */}
      {sortedFields.map(field => (
        <div key={field.id}>
          <Label htmlFor={field.name} className="text-sm font-medium text-foreground mb-2 block">
            {field.label}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {/* Text Input */}
          {field.input_type?.name === 'text' && (
            <Input
              id={field.name}
              type="text"
              placeholder={field.placeholder}
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={isLoading}
              className={errors[field.name] ? 'border-destructive' : ''}
            />
          )}

          {/* Email Input */}
          {field.input_type?.name === 'email' && (
            <Input
              id={field.name}
              type="email"
              placeholder={field.placeholder}
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={isLoading}
              className={errors[field.name] ? 'border-destructive' : ''}
            />
          )}

          {/* Phone Input */}
          {field.input_type?.name === 'phone' && (
            <Input
              id={field.name}
              type="tel"
              placeholder={field.placeholder}
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={isLoading}
              className={errors[field.name] ? 'border-destructive' : ''}
            />
          )}

          {/* Date Input */}
          {field.input_type?.name === 'date' && (
            <Input
              id={field.name}
              type="date"
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={isLoading}
              className={errors[field.name] ? 'border-destructive' : ''}
            />
          )}

          {/* Textarea */}
          {field.input_type?.name === 'textarea' && (
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={isLoading}
              rows={5}
              className={errors[field.name] ? 'border-destructive' : ''}
            />
          )}

          {/* Select */}
          {field.input_type?.name === 'select' && (
            <select
              id={field.name}
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg bg-white text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                errors[field.name] ? 'border-destructive' : 'border-border'
              }`}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(option => (
                <option key={option.id} value={option.option_value}>
                  {option.option_label}
                </option>
              ))}
            </select>
          )}

          {/* File Upload */}
          {field.input_type?.name === 'file' && (
            <div>
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/30 transition-colors">
                <div className="text-center">
                  <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                </div>
                <input
                  id={field.name}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleChange(field.name, file.name);
                    }
                  }}
                  disabled={isLoading}
                />
              </label>
              {formData[field.name] && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {formData[field.name]}
                </p>
              )}
            </div>
          )}

          {/* Radio Button */}
          {field.input_type?.name === 'radio' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground mb-2 block">
                {field.label}
                {field.is_required && <span className="text-destructive ml-1">*</span>}
              </label>
              {field.options?.map(option => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    id={`${field.name}_${option.id}`}
                    name={field.name}
                    type="radio"
                    value={option.option_value}
                    checked={formData[field.name] === option.option_value}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    disabled={isLoading}
                    className="w-4 h-4 border-border cursor-pointer"
                  />
                  <label htmlFor={`${field.name}_${option.id}`} className="text-sm text-muted-foreground cursor-pointer">
                    {option.option_label}
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Checkbox */}
          {field.input_type?.name === 'checkbox' && (
            <div className="flex items-center gap-2">
              <input
                id={field.name}
                name={field.name}
                type="checkbox"
                checked={formData[field.name] || false}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-border cursor-pointer"
              />
              <label htmlFor={field.name} className="text-sm text-muted-foreground cursor-pointer">
                {field.placeholder || 'Check this box'}
              </label>
            </div>
          )}

          {/* Error Message */}
          {errors[field.name] && (
            <p className="text-sm text-destructive mt-2">{errors[field.name]}</p>
          )}
        </div>
      ))}

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading} className="w-full h-11">
        {isLoading ? 'Submitting Application...' : 'Submit Application'}
      </Button>
    </form>
  );
}
