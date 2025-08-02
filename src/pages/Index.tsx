import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, Zap, ArrowRight, Brain, FileSearch, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ModernNavigation } from "@/components/ModernNavigation";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      {/* Hero Section */}
      <div className="bg-gradient-hero text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Brain className="w-12 h-12" />
            <h1 className="text-5xl font-bold">The Future of Smart Recruitment Technology is here.</h1>
          </div>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            We integrate AI-powered resume analysis into your hiring process, automatically evaluating candidates with precision and speed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/hr")} 
              variant="hero" 
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <Briefcase className="w-5 h-5 mr-2" />
              HR Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              onClick={() => navigate("/apply/demo")} 
              variant="outline" 
              size="lg"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Users className="w-5 h-5 mr-2" />
              View Demo Application
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Streamline your hiring process with AI-powered resume analysis and candidate ranking
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="shadow-soft hover:shadow-elegant transition-smooth">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Post Jobs</CardTitle>
              <CardDescription>
                Create job postings and generate shareable application links instantly
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-soft hover:shadow-elegant transition-smooth">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSearch className="w-8 h-8 text-accent" />
              </div>
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>
                Advanced AI evaluates resumes against job requirements and provides detailed scoring
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-soft hover:shadow-elegant transition-smooth">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <CardTitle>Smart Ranking</CardTitle>
              <CardDescription>
                Get ranked candidates with match scores, skill analysis, and hiring recommendations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-6">Why Choose Our HR Assistant?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Zap className="w-6 h-6 text-warning mt-1" />
                <div>
                  <h4 className="font-semibold">Lightning Fast</h4>
                  <p className="text-muted-foreground">Process hundreds of resumes in minutes, not hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Brain className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">AI-Powered Insights</h4>
                  <p className="text-muted-foreground">Get detailed analysis of candidate skills and job fit</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-6 h-6 text-accent mt-1" />
                <div>
                  <h4 className="font-semibold">Bias-Free Evaluation</h4>
                  <p className="text-muted-foreground">Objective scoring based on qualifications only</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-success mt-1" />
                <div>
                  <h4 className="font-semibold">Easy Integration</h4>
                  <p className="text-muted-foreground">Simple workflow that fits into your existing process</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Ready to Get Started?</CardTitle>
              <CardDescription>
                Transform your hiring process today with AI-powered resume evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate("/hr")} 
                variant="hero" 
                size="lg" 
                className="w-full"
              >
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
    </div>
  );
};

export default Index;
