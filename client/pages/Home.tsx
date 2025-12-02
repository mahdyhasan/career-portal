import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, MapPin, DollarSign, Briefcase, Clock, Search, Filter, ChevronDown, X, Plus } from 'lucide-react';
import { jobsApi } from '@/services/api';
import { Job, PaginatedResponse } from '@shared/api';

// Extended interface for jobs with joined fields from API
interface JobWithDetails extends Job {
  department_name?: string;
  job_type_name?: string;
  experience_level_name?: string;
  status_name?: string;
}
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const [jobs, setJobs] = useState<JobWithDetails[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    // Get all jobs for the main page
    const loadJobs = async () => {
      try {
        const response = await jobsApi.getJobs() as PaginatedResponse<JobWithDetails>;
        const jobsData = response.data;
        setJobs(jobsData);
        setFilteredJobs(jobsData);
        
        // Extract unique job types and locations for filters
        const types = [...new Set(jobsData.map(job => job.job_type_name).filter(Boolean))] as string[];
        const depts = [...new Set(jobsData.map(job => job.department_name).filter(Boolean))] as string[];
        setJobTypes(types);
        setLocations(depts);
      } catch (error) {
        console.error('Failed to load jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadJobs();
  }, []);

  useEffect(() => {
    // Filter jobs based on search and filters
    let result = [...jobs];
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.summary.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by job type
    if (selectedJobType !== 'all') {
      result = result.filter(job => job.job_type_name === selectedJobType);
    }
    
    // Filter by location
    if (selectedLocation !== 'all') {
      result = result.filter(job => job.department_name === selectedLocation);
    }
    
    // Sort jobs
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }
    
    setFilteredJobs(result);
  }, [jobs, searchTerm, selectedJobType, selectedLocation, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedJobType('all');
    setSelectedLocation('all');
    setSortBy('newest');
  };

  return (
    <Layout>
      {/* Enhanced Header Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Join Our Team
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Discover exciting career opportunities at Augmex. We're looking for talented individuals who are passionate about making a difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2">
                Explore Positions
                <ArrowRight size={18} />
              </Button>
              <Button variant="outline" size="lg">
                Learn About Our Culture
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search by job title, keywords, or company..."
                className="pl-10 pr-4 py-3 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-white border-b py-4 px-4 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter size={16} className="mr-1" />
                Filters
              </Button>
              <span className="text-sm text-muted-foreground">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'position' : 'positions'} found
              </span>
            </div>

            {/* Post a Job Button for HiringManager and SuperAdmin */}
            {(isAdmin || isSuperAdmin) && (
              <Link to="/admin/create-job">
                <Button size="sm" className="gap-2">
                  <Plus size={16} />
                  Post a Job
                </Button>
              </Link>
            )}
            
            <div className={`${showFilters ? 'flex' : 'hidden md:flex'} flex-wrap gap-3 items-center`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Type:</span>
                <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {jobTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Location:</span>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X size={16} className="mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs List Section */}
      <section className="py-10 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading available jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No jobs match your criteria</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
              <Button onClick={clearFilters}>Clear all filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="group bg-white border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary transition-all duration-300"
                >
                  {/* Job Header */}
                  <div className="p-6 pb-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-base text-muted-foreground mt-1">
                          {job.department_name}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2">{job.job_type_name}</Badge>
                    </div>
                  </div>

                  {/* Job Meta */}
                  <div className="px-6 pb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin size={16} />
                        {job.department_name}
                      </div>
                      {job.salary_min && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign size={16} />
                          {job.salary_min} - {job.salary_max}
                        </div>
                      )}
                      {job.created_at && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock size={16} />
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description Preview */}
                  <div className="px-6 pb-4">
                    <p className="text-sm text-muted-foreground overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {job.summary}
                    </p>
                  </div>

                  {/* CTA Buttons */}
                  <div className="px-6 pb-6 flex gap-3">
                    <Link to={`/jobs/${job.id}`} className="flex-1">
                      <Button className="w-full group-hover:gap-2 transition-all">
                        View Details
                        <ArrowRight size={16} className="ml-1" />
                      </Button>
                    </Link>
                    <Button variant="outline" className="px-4">
                      <Briefcase size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      {/* <section className="bg-blue-50 py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Don't see the right fit?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Sign up for job alerts and we'll notify you when new positions that match your interests become available.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input placeholder="Enter your email" className="flex-1" />
            <Button>Subscribe</Button>
          </div>
        </div>
      </section> */}
    </Layout>
  );
}
