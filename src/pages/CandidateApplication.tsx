import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Send, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeResumeWithGemini, extractTextFromFile } from "@/lib/gemini";
import { supabase } from "@/integrations/supabase/client";

const CandidateApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState<any>(null);
  const [applicationData, setApplicationData] = useState({
    name: "",
    email: "",
    resume: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  const loadJobData = async () => {
    if (!jobId) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJobData(data);
    } catch (error) {
      console.error('Error loading job:', error);
      setJobData(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf" || file.type.includes("document")) {
        setApplicationData(prev => ({ ...prev, resume: file }));
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or Word document",
          variant: "destructive"
        });
      }
    }
  };

  const processResumeWithAI = async (resumeText: string, jobDescription: string) => {
    return await analyzeResumeWithGemini(resumeText, jobDescription);
  };

  const handleSubmit = async () => {
    if (!applicationData.name || !applicationData.email || !applicationData.resume || !jobId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields and upload your resume",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Starting application submission...");
      
      // Extract resume text from uploaded file
      console.log("Extracting text from file...");
      const resumeText = await extractTextFromFile(applicationData.resume);
      console.log("Resume text extracted:", resumeText.substring(0, 100) + "...");
      
      // Process with AI
      console.log("Analyzing with Gemini API...");
      const aiResult = await processResumeWithAI(resumeText, jobData?.description || "");
      console.log("AI analysis complete:", aiResult);

      // Store application in database
      console.log("Saving to database...");
      const { data, error } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          name: applicationData.name,
          email: applicationData.email,
          resume_file_name: applicationData.resume.name,
          resume_text: resumeText,
          ai_analysis: aiResult as any
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Application saved successfully:", data);

      toast({
        title: "Application Submitted Successfully!",
        description: "Your resume has been analyzed and sent to the HR team.",
        variant: "default"
      });

      // Reset form
      setApplicationData({ name: "", email: "", resume: null });
      
    } catch (error) {
      console.error('Detailed error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!jobData) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The job posting you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Job Info Header */}
          <Card className="shadow-soft mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{jobData.title}</CardTitle>
                  <CardDescription className="text-base">{jobData.company}</CardDescription>
                </div>
                <Badge variant="secondary">{jobData.vacancies} positions</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium">Job Description:</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{jobData.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Submit Your Application
              </CardTitle>
              <CardDescription>
                Fill in your details and upload your resume. Our AI will analyze your qualifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={applicationData.name}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={applicationData.email}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="resume">Resume Upload *</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="resume"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> your resume
                        </p>
                        <p className="text-xs text-muted-foreground">PDF or Word documents (MAX. 10MB)</p>
                      </div>
                      <input
                        id="resume"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  {applicationData.resume && (
                    <div className="mt-2 p-2 bg-muted rounded flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{applicationData.resume.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your resume will be analyzed by our AI system</li>
                  <li>• We'll match your skills with the job requirements</li>
                  <li>• HR team will review the analysis and contact qualified candidates</li>
                  <li>• You'll receive feedback within 2-3 business days</li>
                </ul>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                variant="hero"
                size="lg"
                className="w-full"
              >
                {isSubmitting ? (
                  "Processing Application..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>

              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CandidateApplication;