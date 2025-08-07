import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Users, TrendingUp, Plus, Trash2, LogOut, Copy, Eye, Mail, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User, Session } from '@supabase/supabase-js';
import JobDescriptionGenerator from '@/components/JobDescriptionGenerator';

const HRDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    salary: "",
    location: "",
    vacancies: 1
  });
  const [showGenerator, setShowGenerator] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/auth');
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load user profile and data
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadJobsAndApplications();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadJobsAndApplications = async () => {
    try {
      // Load jobs for this user only
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('hr_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Load applications for this user's jobs
      const jobIds = jobsData?.map(job => job.id) || [];
      let applicationsData: any[] = [];
      
      if (jobIds.length > 0) {
        const { data, error: applicationsError } = await supabase
          .from('applications')
          .select('*')
          .in('job_id', jobIds)
          .order('submitted_at', { ascending: false });

        if (applicationsError) throw applicationsError;
        applicationsData = data || [];
      }

      // Count applications per job
      const jobsWithCounts = jobsData?.map(job => ({
        ...job,
        applicants: applicationsData?.filter(app => app.job_id === job.id).length || 0,
        createdAt: new Date(job.created_at).toLocaleDateString()
      })) || [];

      setJobs(jobsWithCounts);
      setApplications(applicationsData);
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
    if (!formData.title || !formData.description) {
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
            hr_user_id: user?.id,
            company: profile?.company_name || 'Company',
            title: formData.title,
            description: formData.description,
            salary: formData.salary,
            location: formData.location,
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
        title: "",
        description: "",
        salary: "",
        location: "",
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
        .eq('id', jobId)
        .eq('hr_user_id', user?.id); // Ensure user can only delete their own jobs

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const copyApplicationLink = (jobId: string) => {
    const link = `${window.location.origin}/apply/${jobId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied!",
      description: "Application link has been copied to clipboard",
    });
  };

  const handleGeneratedDescription = (description: string, title: string, company: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      description
    }));
    setShowGenerator(false);
    toast({
      title: "Job Description Applied!",
      description: "Generated description has been applied to the job posting form.",
    });
  };

  if (!user || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-accent/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 left-1/3 w-40 h-40 bg-success/5 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-warning/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-primary/5 rounded-full blur-xl"></div>
      </div>
      
      {/* Header */}
      <div className="bg-gradient-hero text-primary-foreground py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-24 h-24 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-16 h-16 border-2 border-white rounded-full"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Briefcase className="w-10 h-10" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl font-bold">HR Dashboard</h1>
                <p className="text-primary-foreground/80 text-lg">Welcome back, {profile?.full_name || user.email}</p>
                <p className="text-primary-foreground/60 text-sm">{profile?.company_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                <div className="w-32 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-1">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs text-primary-foreground">AI-Powered HR</p>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-soft hover:shadow-elegant transition-smooth group bg-background/80 backdrop-blur-sm border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Active Jobs</p>
                  <p className="text-3xl font-bold text-primary">{jobs.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Currently posted</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft hover:shadow-elegant transition-smooth group bg-background/80 backdrop-blur-sm border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Applicants</p>
                  <p className="text-3xl font-bold text-success">{jobs.reduce((sum, job) => sum + job.applicants, 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Across all jobs</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft hover:shadow-elegant transition-smooth group bg-background/80 backdrop-blur-sm border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Success Rate</p>
                  <p className="text-3xl font-bold text-warning">87%</p>
                  <p className="text-xs text-muted-foreground mt-1">AI accuracy</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Job Posting Form */}
          <Card className="shadow-elegant relative overflow-hidden bg-background/80 backdrop-blur-sm border border-border/50">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                Post New Job
              </CardTitle>
              <CardDescription>Create a new job posting and generate candidate application form</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={showGenerator ? "generator" : "manual"} onValueChange={(value) => setShowGenerator(value === "generator")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="generator" className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    AI Generator
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Senior Software Engineer"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the role, requirements, skills needed..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={6}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salary">Salary</Label>
                      <Input
                        id="salary"
                        placeholder="e.g., $80,000 - $120,000"
                        value={formData.salary}
                        onChange={(e) => handleInputChange("salary", e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Remote, New York, etc."
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                      />
                    </div>
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
                  
                  <Button onClick={handlePostJob} size="lg" className="w-full">
                    Post Job & Generate Application Link
                  </Button>
                </TabsContent>
                
                <TabsContent value="generator" className="mt-6">
                  <JobDescriptionGenerator 
                    onGenerate={handleGeneratedDescription}
                    recruiterName={profile?.full_name}
                    companyName={profile?.company_name || 'Your Company'}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Active Jobs */}
          <Card className="shadow-elegant bg-background/80 backdrop-blur-sm border border-border/50">
            <CardHeader>
              <CardTitle>Your Job Postings</CardTitle>
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
                          {job.salary && <p className="text-sm text-success">{job.salary}</p>}
                          {job.location && <p className="text-sm text-muted-foreground">{job.location}</p>}
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
                            onClick={() => copyApplicationLink(job.id)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Link
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`/apply/${job.id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-1" />
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