import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const ModernNavigation = () => {
  return (
    <nav className="flex items-center justify-between p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center space-x-8">
        <h1 className="text-2xl font-bold text-foreground">ATS Pro</h1>
        
        <div className="hidden md:flex items-center space-x-6">
          <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Home
          </a>
          <a href="/hr" className="text-foreground">
            HR Dashboard
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Analytics
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Settings
          </a>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Badge variant="secondary" className="hidden sm:flex">
          AI Powered
        </Badge>
        <Button variant="outline" size="sm">
          Contact Us
        </Button>
      </div>
    </nav>
  );
};