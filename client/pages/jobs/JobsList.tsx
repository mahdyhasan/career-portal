import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { JobCard } from '@/components/jobs/JobCard';
import { Job } from '@shared/api';
import { jobsApi } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

export default function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedJobType, setSelectedJobType] = useState<string | null>(null);

  const jobTypes = ['fulltime', 'parttime', 'contract', 'internship'];
  const locations = Array.from(new Set(jobs.map(j => j.location_text))).filter(Boolean).sort();

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        const response = await jobsApi.getJobs(1, 100);
        setJobs(response.data);
        setFilteredJobs(response.data);
      } catch (error) {
        console.error('Failed to load jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = jobs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.company?.name?.toLowerCase().includes(query)
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter(job => job.location_text === selectedLocation);
    }

    if (selectedJobType) {
      filtered = filtered.filter(job => job.job_type?.name === selectedJobType);
    }

    setFilteredJobs(filtered);
  }, [searchQuery, selectedLocation, selectedJobType, jobs]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation(null);
    setSelectedJobType(null);
  };

  const hasActiveFilters = searchQuery || selectedLocation || selectedJobType;

  return (
    <Layout>
      <div className="py-12 px-4">
        <div className="container mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Browse Jobs
            </h1>
            <p className="text-muted-foreground text-lg">
              Explore {jobs.length} opportunities waiting for you
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Filters */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-border rounded-xl p-6 sticky top-[100px]">
                <h3 className="font-bold text-foreground mb-4">Filters</h3>

                {/* Search */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Search Jobs
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Job title, company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                {/* Job Type Filter */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Job Type
                  </label>
                  <div className="space-y-2">
                    {jobTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedJobType(selectedJobType === type ? null : type)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                          selectedJobType === type
                            ? 'bg-primary text-white'
                            : 'hover:bg-secondary text-foreground'
                        }`}
                      >
                        {type === 'fulltime' && 'Full-time'}
                        {type === 'parttime' && 'Part-time'}
                        {type === 'contract' && 'Contract'}
                        {type === 'internship' && 'Internship'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Location
                  </label>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {locations.map((location) => (
                      <button
                        key={location}
                        onClick={() => setSelectedLocation(selectedLocation === location ? null : location)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                          selectedLocation === location
                            ? 'bg-primary text-white'
                            : 'hover:bg-secondary text-foreground'
                        }`}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X size={16} className="mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Main Content - Jobs List */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading jobs...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-border">
                  <p className="text-muted-foreground text-lg">
                    {searchQuery || selectedLocation || selectedJobType
                      ? 'No jobs found matching your filters'
                      : 'No jobs available'}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  {/* Results Info */}
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredJobs.length} of {jobs.length} jobs
                    </p>
                  </div>

                  {/* Jobs Grid */}
                  <div className="space-y-4">
                    {filteredJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
