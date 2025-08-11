import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Eye,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Application {
  id: string;
  job_id: string;
  name: string;
  email: string;
  resume_file_name: string;
  ai_analysis: {
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    summary: string;
    recommendation: string;
  };
  submitted_at: string;
}

const ApplicationResults = () => {
  const { jobId } = useParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobData, setJobData] = useState<any>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    loadJobAndApplications();
  }, [jobId]);

  const loadJobAndApplications = async () => {
    if (!jobId) return;

    try {
      // Load job data
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      setJobData(jobData);

      // Load applications for this job
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId);

      if (applicationsError) throw applicationsError;
      setApplications((applicationsData || []) as any);
    } catch (error) {
      console.error('Error loading data:', error);
      setJobData(null);
      setApplications([]);
    }
  };

  const getStatusIcon = (recommendation: string) => {
    switch (recommendation) {
      case "Shortlist for Next Round":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "Consider with Caution":
        return <AlertCircle className="w-4 h-4 text-warning" />;
      default:
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (recommendation: string) => {
    switch (recommendation) {
      case "Shortlist for Next Round":
        return <Badge variant="default" className="bg-success text-success-foreground">Shortlisted</Badge>;
      case "Consider with Caution":
        return <Badge variant="default" className="bg-warning text-warning-foreground">Review</Badge>;
      default:
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  const appsWithScores = applications.filter(app => (app.ai_analysis as any) && typeof (app.ai_analysis as any).matchScore === 'number');
  const averageScore = appsWithScores.length > 0 
    ? Math.round(appsWithScores.reduce((sum, app) => sum + (app.ai_analysis as any).matchScore, 0) / appsWithScores.length)
    : 0;

  const shortlistedCount = applications.filter(app => app.ai_analysis.recommendation === "Shortlist for Next Round").length;

  if (!jobData) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground">Unable to load job data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card">
      {/* Header */}
      <div className="bg-gradient-hero text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">{jobData.title} - Applications</h1>
          <p className="text-primary-foreground/80">{jobData.company}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Applications</p>
                  <p className="text-2xl font-bold">{applications.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Shortlisted</p>
                  <p className="text-2xl font-bold">{shortlistedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Average Score</p>
                  <p className="text-2xl font-bold">{averageScore}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Applications Table */}
          <div className="lg:col-span-2">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Candidate Applications</CardTitle>
                <CardDescription>AI-evaluated candidates ranked by match score</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No applications received yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications
                        .filter(app => (app.ai_analysis as any) && typeof (app.ai_analysis as any).matchScore === 'number')
                        .sort((a, b) => (b.ai_analysis as any).matchScore - (a.ai_analysis as any).matchScore)
                        .map((app) => (
                          <TableRow key={app.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{app.name}</p>
                                <p className="text-sm text-muted-foreground">{app.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{(app.ai_analysis as any).matchScore}%</span>
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${(app.ai_analysis as any).matchScore}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge((app.ai_analysis as any).recommendation)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedApplication(app)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Application Detail */}
          <div>
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
                <CardDescription>
                  {selectedApplication ? "AI analysis results" : "Select an application to view details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedApplication ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Candidate Info</h4>
                      <p className="text-sm"><strong>Name:</strong> {selectedApplication.name}</p>
                      <p className="text-sm"><strong>Email:</strong> {selectedApplication.email}</p>
                      <p className="text-sm"><strong>Applied:</strong> {new Date(selectedApplication.submitted_at).toLocaleDateString()}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Match Score</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">{(selectedApplication.ai_analysis as any).matchScore}%</span>
                        {getStatusIcon((selectedApplication.ai_analysis as any).recommendation)}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Matched Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {(selectedApplication.ai_analysis as any).matchedSkills?.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Missing Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {(selectedApplication.ai_analysis as any).missingSkills?.map((skill: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">AI Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        {(selectedApplication.ai_analysis as any).summary}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Recommendation</h4>
                      <div className="flex items-center gap-2">
                        {getStatusIcon((selectedApplication.ai_analysis as any).recommendation)}
                        <span className="text-sm font-medium">
                          {(selectedApplication.ai_analysis as any).recommendation}
                        </span>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download Resume
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Select an application to view AI analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationResults;