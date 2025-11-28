import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Briefcase, Users, TrendingUp, MapPin, DollarSign } from 'lucide-react';
import { jobsApi } from '@/services/api';
import { Job } from '@shared/api';

export default function Home() {
  const navigate = useNavigate();
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Get first 3 jobs as featured
    const loadFeaturedJobs = async () => {
      try {
        const response = await jobsApi.getJobs();
        setFeaturedJobs(response.data.slice(0, 3));
      } catch (error) {
        console.error('Failed to load featured jobs:', error);
      }
    };
    
    loadFeaturedJobs();
  }, []);

  const stats = [
    { icon: Briefcase, label: 'Jobs Posted', value: '1000+' },
    { icon: Users, label: 'Active Candidates', value: '5000+' },
    { icon: TrendingUp, label: 'Companies Hiring', value: '500+' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 md:py-24 px-4 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-6 flex justify-center">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold">
                ✨ Your career starts here
              </Badge>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in leading-tight">
              Find Your Next{' '}
              <span className="text-primary">Career Opportunity</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in max-w-2xl mx-auto">
              Discover amazing job opportunities at top companies. Browse open positions, apply with just a few clicks, and track your applications in real-time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-in-up">
              <Button
                size="lg"
                onClick={() => navigate('/jobs')}
                className="px-8 py-6 text-base font-semibold"
              >
                Browse Jobs
                <ArrowRight size={20} className="ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/signup')}
                className="px-8 py-6 text-base font-semibold"
              >
                Sign Up as Candidate
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-border">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon size={24} className="text-primary" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {stat.value}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Opportunities
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Check out some of our most exciting job openings right now
            </p>
          </div>

          {/* Jobs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featuredJobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="group bg-white border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary transition-all duration-300 animate-fade-in"
              >
                {/* Job Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.company?.name}
                    </p>
                  </div>
                  <Badge variant="secondary">{job.job_type?.name}</Badge>
                </div>

                {/* Job Meta */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={16} />
                    {job.location_text}
                  </div>
                  {job.salary_range && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign size={16} />
                      {job.salary_range}
                    </div>
                  )}
                </div>

                {/* Description Preview */}
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                  {job.description}
                </p>

                {/* CTA */}
                <div className="flex items-center text-primary text-sm font-semibold group-hover:gap-2 transition-all">
                  View Details
                  <ArrowRight size={16} className="ml-1" />
                </div>
              </Link>
            ))}
          </div>

          {/* View All Jobs CTA */}
          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/jobs')}
              className="px-8"
            >
              View All Jobs
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get hired in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '01',
                title: 'Create Account',
                description: 'Sign up as a candidate and complete your profile with your skills and experience.',
              },
              {
                step: '02',
                title: 'Browse & Apply',
                description: 'Explore thousands of job openings and apply with your tailored application form.',
              },
              {
                step: '03',
                title: 'Track & Succeed',
                description: 'Monitor your applications in real-time and get notified about updates from employers.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative text-center"
              >
                <div className="inline-block mb-4">
                  <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Career Journey?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of job seekers who have found their dream jobs through Augmex.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/signup')}
                className="px-8"
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/jobs')}
                className="px-8 border-white text-white hover:bg-white/10"
              >
                Browse Jobs
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
