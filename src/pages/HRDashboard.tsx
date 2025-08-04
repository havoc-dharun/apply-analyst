import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, TrendingUp, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const HRDashboard = () => {
  const [formData, setFormData] = useState({
    company: "",
    jobTitle: "",
    jobDescription: "",
    vacancies: 1
  });
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const { toast } = useToast();

  // Load jobs and applications from database
  useEffect(() => {
    loadJobsAndApplications();
  }, []);

  const loadJobsAndApplications = async () => {
    try {
      // Load jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Load applications and count for each job
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*');

      if (applicationsError) throw applicationsError;

      // Count applications per job
      const jobsWithCounts = jobsData?.map(job => ({
        ...job,
        applicants: applicationsData?.filter(app => app.job_id === job.id).length || 0,
        createdAt: new Date(job.created_at).toLocaleDateString()
      })) || [];

      setJobs(jobsWithCounts);
      setApplications(applicationsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs and applications",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePostJob = async () => {
    if (!formData.company || !formData.jobTitle || !formData.jobDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([
          {
            company: formData.company,
            title: formData.jobTitle,
            description: formData.jobDescription,
            vacancies: formData.vacancies
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const applicationLink = `${window.location.origin}/apply/${data.id}`;
      
      toast({
        title: "Job Posted Successfully!",
        description: `Application link: ${applicationLink}`,
        variant: "default"
      });

      // Reset form
      setFormData({
        company: "",
        jobTitle: "",
        jobDescription: "",
        vacancies: 1
      });

      // Reload jobs
      loadJobsAndApplications();
    } catch (error) {
      console.error('Error posting job:', error);
      toast({
        title: "Error",
        description: "Failed to post job",
        variant: "destructive"
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Job Deleted",
        description: "Job posting has been removed successfully",
        variant: "default"
      });

      // Reload jobs
      loadJobsAndApplications();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      {/* Header */}
      <div className="bg-gradient-hero text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <Briefcase className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">HR Assistant</h1>
              <p className="text-primary-foreground/80">AI-Powered Resume Evaluation System</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Active Jobs</p>
                  <p className="text-2xl font-bold">{jobs.length}</p>
                </div>
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Applicants</p>
                  <p className="text-2xl font-bold">{jobs.reduce((sum, job) => sum + job.applicants, 0)}</p>
                </div>
                <Users className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Success Rate</p>
                  <p className="text-2xl font-bold">87%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Job Posting Form */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Post New Job
              </CardTitle>
              <CardDescription>Create a new job posting and generate candidate application form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  placeholder="Enter company name"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Senior Software Engineer"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="jobDescription">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Describe the role, requirements, skills needed..."
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                  rows={6}
                />
              </div>
              
              <div>
                <Label htmlFor="vacancies">Number of Vacancies</Label>
                <Input
                  id="vacancies"
                  type="number"
                  min="1"
                  value={formData.vacancies}
                  onChange={(e) => handleInputChange("vacancies", parseInt(e.target.value) || 1)}
                />
              </div>
              
              <Button onClick={handlePostJob} variant="hero" size="lg" className="w-full">
                Post Job & Generate Application Link
              </Button>
            </CardContent>
          </Card>

          {/* Active Jobs */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Active Job Postings</CardTitle>
              <CardDescription>Manage your current job openings</CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No jobs posted yet</p>
                  <p className="text-sm">Create your first job posting to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{job.applicants} applicants</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {job.description.substring(0, 100)}...
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Posted {job.createdAt}</span>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`/apply/${job.id}`, '_blank')}
                          >
                            View Form
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`/results/${job.id}`, '_blank')}
                          >
                            View Results
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;