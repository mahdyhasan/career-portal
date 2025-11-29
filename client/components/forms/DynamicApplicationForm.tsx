import { useState } from 'react';
import { JobFormField } from '@shared/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertCircle, Upload } from 'lucide-react';

interface DynamicApplicationFormProps {
  fields: JobFormField[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  isLoading?: boolean;
}

export function DynamicApplicationForm({
  fields,
  onSubmit,
  isLoading = false,
}: DynamicApplicationFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach(field => {
      initial[field.name] = '';
    });
    return initial;
  });

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
      if (field.is_required && !value) {
        newErrors[field.name] = `${field.label} is required`;
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

          {/* Checkbox */}
          {field.input_type?.name === 'checkbox' && (
            <div className="flex items-center gap-2">
              <input
                id={field.name}
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
