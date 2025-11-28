import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Job } from '@shared/api';
import { MapPin, DollarSign, Briefcase, ArrowRight } from 'lucide-react';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group bg-white border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {job.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {job.company}
          </p>
        </div>
        <Badge variant="secondary" className="whitespace-nowrap ml-2">
          {job.jobType === 'fulltime' ? 'Full-time' : job.jobType === 'parttime' ? 'Part-time' : job.jobType === 'contract' ? 'Contract' : 'Internship'}
        </Badge>
      </div>

      {/* Meta Information */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin size={16} className="flex-shrink-0" />
          <span className="line-clamp-1">{job.location}</span>
        </div>

        {job.salaryMin && job.salaryMax && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign size={16} className="flex-shrink-0" />
            <span>
              ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
            </span>
          </div>
        )}

        {job.experience && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase size={16} className="flex-shrink-0" />
            <span>{job.experience}</span>
          </div>
        )}
      </div>

      {/* Description Preview */}
      <p className="text-sm text-muted-foreground mb-6 line-clamp-3 h-[60px]">
        {job.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Posted {new Date(job.createdAt).toLocaleDateString()}
        </div>
        <div className="flex items-center text-primary text-sm font-semibold group-hover:gap-2 transition-all">
          View
          <ArrowRight size={16} className="ml-1" />
        </div>
      </div>
    </Link>
  );
}
