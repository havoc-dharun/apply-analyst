import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, Zap, ArrowRight, Brain, FileSearch, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModernNavigation } from "@/components/ModernNavigation";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-accent/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 left-1/3 w-40 h-40 bg-success/5 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-warning/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-primary/5 rounded-full blur-xl"></div>
      </div>
      
      <ModernNavigation />
      {/* Hero Section */}
      <div className="bg-gradient-hero text-primary-foreground py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-full"></div>
          <div className="absolute top-32 right-20 w-16 h-16 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 border-2 border-white rounded-full"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <Brain className="w-12 h-12" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-5xl font-bold">The Future of Smart Recruitment Technology is here.</h1>
          </div>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            We integrate AI-powered resume analysis into your hiring process, automatically evaluating candidates with precision and speed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/auth")} variant="hero" size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Briefcase className="w-5 h-5 mr-2" />
              HR Login
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Streamline your hiring process with AI-powered resume analysis and candidate ranking
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="shadow-soft hover:shadow-elegant transition-smooth group bg-background/80 backdrop-blur-sm border border-border/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Post Jobs</CardTitle>
              <CardDescription>
                Create job postings and generate shareable application links instantly
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-full h-32 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">AI-Powered Job Posting</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-elegant transition-smooth group bg-background/80 backdrop-blur-sm border border-border/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FileSearch className="w-8 h-8 text-accent" />
              </div>
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>
                Advanced AI evaluates resumes against job requirements and provides detailed scoring
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-full h-32 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FileSearch className="w-6 h-6 text-accent" />
                  </div>
                  <p className="text-xs text-muted-foreground">AI-Powered Analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-elegant transition-smooth group bg-background/80 backdrop-blur-sm border border-border/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <CardTitle>Smart Ranking</CardTitle>
              <CardDescription>
                Get ranked candidates with match scores, skill analysis, and hiring recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-full h-32 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <p className="text-xs text-muted-foreground">AI-Powered Ranking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-6">Why Choose Our HR Assistant?</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-warning/5 to-warning/10 border border-warning/20 backdrop-blur-sm">
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Lightning Fast</h4>
                  <p className="text-muted-foreground">Process hundreds of resumes in minutes, not hours</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 backdrop-blur-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">AI-Powered Insights</h4>
                  <p className="text-muted-foreground">Get detailed analysis of candidate skills and job fit</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/20 backdrop-blur-sm">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Bias-Free Evaluation</h4>
                  <p className="text-muted-foreground">Objective scoring based on qualifications only</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-success/5 to-success/10 border border-success/20 backdrop-blur-sm">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Easy Integration</h4>
                  <p className="text-muted-foreground">Simple workflow that fits into your existing process</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="shadow-elegant relative overflow-hidden bg-background/80 backdrop-blur-sm border border-border/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <CardHeader>
              <CardTitle>Ready to Get Started?</CardTitle>
              <CardDescription>
                Transform your hiring process today with AI-powered resume evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="w-full h-32 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">AI-Powered Team Collaboration</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate("/auth")} variant="hero" size="lg" className="w-full">
                <Briefcase className="w-5 h-5 mr-2" />
                Start Using HR Dashboard
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  No setup required • Start posting jobs immediately
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Index;