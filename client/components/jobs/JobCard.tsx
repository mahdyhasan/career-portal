import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Briefcase, ArrowRight, Building } from 'lucide-react';

interface JobCardProps {
  job: any;
}

export function JobCard({ job }: JobCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getJobTypeDisplay = (jobTypeName: string) => {
    switch (jobTypeName?.toLowerCase()) {
      case 'fulltime':
        return 'Full-time';
      case 'parttime':
        return 'Part-time';
      case 'contract':
        return 'Contract';
      case 'internship':
        return 'Internship';
      default:
        return jobTypeName || 'Full-time';
    }
  };

  const getSalaryDisplay = (salaryRange: string) => {
    if (!salaryRange) return null;
    
    // Try to parse salary range (e.g., "$50000 - $70000" or "50000-70000")
    const match = salaryRange.match(/(\d+(?:,\d+)?)/g);
    if (match && match.length >= 2) {
      const min = parseInt(match[0].replace(',', ''));
      const max = parseInt(match[1].replace(',', ''));
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    }
    
    return salaryRange;
  };

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group bg-white border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Building size={14} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {job.company_name || 'Company'}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="whitespace-nowrap ml-2">
          {getJobTypeDisplay(job.job_type_name)}
        </Badge>
      </div>

      {/* Meta Information */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin size={16} className="flex-shrink-0" />
          <span className="line-clamp-1">{job.location_text || 'Location TBD'}</span>
        </div>

        {getSalaryDisplay(job.salary_range) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign size={16} className="flex-shrink-0" />
            <span>{getSalaryDisplay(job.salary_range)}</span>
          </div>
        )}

        {job.experience_level_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase size={16} className="flex-shrink-0" />
            <span>{job.experience_level_name}</span>
          </div>
        )}
      </div>

      {/* Description Preview */}
      <p className="text-sm text-muted-foreground mb-6 line-clamp-3 h-[60px]">
        {job.description || 'No description available'}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Posted {formatDate(job.created_at)}
        </div>
        <div className="flex items-center text-primary text-sm font-semibold group-hover:gap-2 transition-all">
          View
          <ArrowRight size={16} className="ml-1" />
        </div>
      </div>
    </Link>
  );
}
