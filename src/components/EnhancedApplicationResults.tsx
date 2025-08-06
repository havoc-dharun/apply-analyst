import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Users, Award, TrendingUp, CheckCircle, 
  XCircle, AlertTriangle, Download, Mail, Star 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Application {
  id: string;
  name: string;
  email: string;
  resume_file_name: string;
  submitted_at: string;
  ai_analysis: {
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    summary: string;
    recommendation: "Shortlist for Next Round" | "Consider with Caution" | "Reject";
  } | null;
}

interface JobData {
  id: string;
  title: string;
  company: string;
  description: string;
}

const EnhancedApplicationResults: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      loadJobAndApplications();
    }
  }, [jobId]);

  const loadJobAndApplications = async () => {
    try {
      setLoading(true);
      
      // Load job data
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) {
        console.error('Error loading job:', jobError);
        return;
      }

      setJobData(job);

      // Load applications
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .order('submitted_at', { ascending: false });

      if (appsError) {
        console.error('Error loading applications:', appsError);
        return;
      }

      const typedApps = (apps || []).map(app => ({
        ...app,
        ai_analysis: app.ai_analysis as Application['ai_analysis']
      }));
      setApplications(typedApps);
    } catch (error) {
      console.error('Error in loadJobAndApplications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (recommendation: string) => {
    switch (recommendation) {
      case "Shortlist for Next Round":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "Consider with Caution":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "Reject":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (recommendation: string) => {
    switch (recommendation) {
      case "Shortlist for Next Round":
        return <Badge variant="default" className="bg-success text-success-foreground">Shortlist</Badge>;
      case "Consider with Caution":
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Consider</Badge>;
      case "Reject":
        return <Badge variant="destructive">Reject</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return "bg-success/10 border-success/20";
    if (score >= 60) return "bg-warning/10 border-warning/20";
    return "bg-destructive/10 border-destructive/20";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Job not found</h2>
            <Button onClick={() => navigate('/hr')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const applicationsWithAnalysis = applications.filter(app => app.ai_analysis);
  const shortlistedCount = applicationsWithAnalysis.filter(
    app => app.ai_analysis?.recommendation === "Shortlist for Next Round"
  ).length;
  const averageScore = applicationsWithAnalysis.length > 0
    ? Math.round(applicationsWithAnalysis.reduce((sum, app) => sum + (app.ai_analysis?.matchScore || 0), 0) / applicationsWithAnalysis.length)
    : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/hr')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">{jobData.title}</h1>
            </div>
            <p className="text-muted-foreground">{jobData.company} • Application Results</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                  <p className="text-3xl font-bold">{applications.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Shortlisted</p>
                  <p className="text-3xl font-bold text-success">{shortlistedCount}</p>
                </div>
                <Award className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>{averageScore}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Candidate Applications</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {applications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No applications received yet for this position.
                  </div>
                ) : (
                  <div className="space-y-0">
                    {applications.map((application, index) => (
                      <div key={application.id}>
                        <div 
                          className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedApplication?.id === application.id ? 'bg-muted/30 border-l-4 border-primary' : ''
                          }`}
                          onClick={() => setSelectedApplication(application)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">{application.name}</h3>
                                {application.ai_analysis && getStatusIcon(application.ai_analysis.recommendation)}
                              </div>
                              <p className="text-sm text-muted-foreground">{application.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Applied {new Date(application.submitted_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              {application.ai_analysis && (
                                <div className={`px-3 py-1 rounded-full border ${getScoreBackground(application.ai_analysis.matchScore)}`}>
                                  <span className={`font-bold ${getScoreColor(application.ai_analysis.matchScore)}`}>
                                    {application.ai_analysis.matchScore}%
                                  </span>
                                </div>
                              )}
                              {application.ai_analysis && getStatusBadge(application.ai_analysis.recommendation)}
                            </div>
                          </div>
                        </div>
                        {index < applications.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Candidate Details */}
          <div className="space-y-4">
            {selectedApplication ? (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Candidate Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedApplication.name}</h3>
                    <p className="text-muted-foreground">{selectedApplication.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Resume: {selectedApplication.resume_file_name}
                    </p>
                  </div>

                  {selectedApplication.ai_analysis ? (
                    <div className="space-y-4">
                      <Separator />
                      
                      {/* Match Score */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Match Score</span>
                          <span className={`font-bold ${getScoreColor(selectedApplication.ai_analysis.matchScore)}`}>
                            {selectedApplication.ai_analysis.matchScore}%
                          </span>
                        </div>
                        <Progress 
                          value={selectedApplication.ai_analysis.matchScore} 
                          className="h-2"
                        />
                      </div>

                      {/* Recommendation */}
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Recommendation</span>
                        <div>
                          {getStatusBadge(selectedApplication.ai_analysis.recommendation)}
                        </div>
                      </div>

                      {/* Matched Skills */}
                      {selectedApplication.ai_analysis.matchedSkills.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Matched Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedApplication.ai_analysis.matchedSkills.map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-success/10 border-success/20 text-success-foreground">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills */}
                      {selectedApplication.ai_analysis.missingSkills.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Missing Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {selectedApplication.ai_analysis.missingSkills.map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-destructive/10 border-destructive/20 text-destructive-foreground">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Summary */}
                      <div className="space-y-2">
                        <span className="text-sm font-medium">AI Analysis Summary</span>
                        <div className="bg-muted/50 p-3 rounded text-sm">
                          {selectedApplication.ai_analysis.summary}
                        </div>
                      </div>

                      <Separator />

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button className="w-full" size="sm">
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </Button>
                        <Button variant="outline" className="w-full" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download Resume
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      AI analysis not available for this application.
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-soft">
                <CardContent className="p-6 text-center text-muted-foreground">
                  Select a candidate to view detailed analysis
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedApplicationResults;