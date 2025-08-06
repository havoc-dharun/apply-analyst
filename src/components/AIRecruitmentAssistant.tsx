import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, User, Wand2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
}

interface AIRecruitmentAssistantProps {
  recruiterName?: string;
  companyName?: string;
  onJobDescriptionGenerated?: (jd: string, title: string, skills: string[]) => void;
}

const AIRecruitmentAssistant: React.FC<AIRecruitmentAssistantProps> = ({
  recruiterName,
  companyName,
  onJobDescriptionGenerated
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello ${recruiterName || 'there'}! 👋 I'm your AI recruitment assistant. I'm here to help you create detailed job descriptions and analyze candidate resumes.\n\n**What role are you hiring for today?**\n\nJust tell me the position title (e.g., "Senior Software Engineer", "Marketing Manager", "Data Analyst") and I'll help you create a comprehensive job description!`,
      timestamp: new Date()
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationState, setConversationState] = useState<'initial' | 'generating_jd' | 'jd_ready' | 'analyzing_resume'>('initial');
  const [currentJobData, setCurrentJobData] = useState<{
    title: string;
    description: string;
    skills: string[];
  } | null>(null);
  const { toast } = useToast();

  const addMessage = (type: 'user' | 'assistant', content: string, data?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      data
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const generateJobDescription = async (roleTitle: string) => {
    setIsProcessing(true);
    
    try {
      // Simulate AI processing with a more sophisticated job description generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const jobDescriptions = {
        'senior software engineer': {
          description: `## Senior Software Engineer

**Company:** ${companyName || 'Our Company'}
**Department:** Engineering
**Employment Type:** Full-Time
**Experience Required:** 5-8 years
**Location:** Remote/Hybrid

### Job Summary
We are seeking a highly skilled Senior Software Engineer to join our dynamic engineering team. This role offers an excellent opportunity to work on cutting-edge technologies and lead technical initiatives that drive our product forward.

### Key Responsibilities
• Design and develop scalable web applications using modern technologies
• Lead technical architecture decisions and code reviews
• Mentor junior developers and contribute to team growth
• Collaborate with product managers and designers to deliver exceptional user experiences
• Optimize application performance and ensure high-quality code standards
• Participate in agile development processes and sprint planning

### Required Skills & Qualifications
• 5+ years of experience in software development
• Proficiency in JavaScript, TypeScript, and modern frameworks (React, Vue, or Angular)
• Strong backend development skills with Node.js, Python, or Java
• Experience with databases (PostgreSQL, MongoDB, or MySQL)
• Knowledge of cloud platforms (AWS, Google Cloud, or Azure)
• Understanding of DevOps practices and CI/CD pipelines
• Excellent problem-solving and communication skills

### Preferred Qualifications
• Experience with microservices architecture
• Knowledge of containerization (Docker, Kubernetes)
• Familiarity with testing frameworks and TDD practices
• Open source contributions
• Leadership or mentoring experience

### Tools & Technologies
• Git, GitHub/GitLab
• Docker, Kubernetes
• AWS/GCP/Azure
• Jenkins, GitHub Actions
• Monitoring tools (DataDog, New Relic)

### What We Offer
• Competitive salary and equity package
• Comprehensive health, dental, and vision insurance
• Flexible work arrangements and unlimited PTO
• Professional development budget
• State-of-the-art equipment and tools

*Equal Opportunity Employer*`,
          skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL', 'AWS', 'Docker', 'Git', 'Agile', 'Microservices', 'CI/CD']
        },
        'marketing manager': {
          description: `## Marketing Manager

**Company:** ${companyName || 'Our Company'}
**Department:** Marketing
**Employment Type:** Full-Time
**Experience Required:** 3-5 years
**Location:** Remote/Hybrid

### Job Summary
We are looking for a creative and data-driven Marketing Manager to develop and execute comprehensive marketing strategies that drive brand awareness, lead generation, and customer engagement.

### Key Responsibilities
• Develop and implement integrated marketing campaigns across multiple channels
• Manage social media presence and content marketing initiatives
• Analyze marketing performance metrics and optimize campaigns for ROI
• Collaborate with sales team to align marketing efforts with revenue goals
• Oversee brand messaging and ensure consistent communication
• Manage marketing budget and vendor relationships

### Required Skills & Qualifications
• 3+ years of experience in digital marketing or related field
• Proficiency in marketing automation platforms (HubSpot, Marketo, or Pardot)
• Strong analytical skills with experience in Google Analytics and marketing metrics
• Excellent written and verbal communication skills
• Experience with social media management and content creation
• Knowledge of SEO/SEM best practices
• Project management and organizational skills

### Preferred Qualifications
• Experience with CRM systems (Salesforce, HubSpot)
• Knowledge of graphic design tools (Adobe Creative Suite, Canva)
• Experience with email marketing platforms
• Understanding of conversion rate optimization
• Previous experience in B2B or SaaS marketing

### Tools & Technologies
• Google Analytics, Google Ads
• HubSpot, Salesforce
• Social media management tools
• Adobe Creative Suite
• Email marketing platforms

### What We Offer
• Competitive salary and performance bonuses
• Health and wellness benefits
• Professional development opportunities
• Creative and collaborative work environment
• Flexible work arrangements

*Equal Opportunity Employer*`,
          skills: ['Digital Marketing', 'HubSpot', 'Google Analytics', 'Social Media Management', 'SEO', 'SEM', 'Content Marketing', 'CRM', 'Email Marketing', 'Adobe Creative Suite', 'Project Management', 'Marketing Automation']
        },
        'data analyst': {
          description: `## Data Analyst

**Company:** ${companyName || 'Our Company'}
**Department:** Data & Analytics
**Employment Type:** Full-Time
**Experience Required:** 2-4 years
**Location:** Remote/Hybrid

### Job Summary
We are seeking a detail-oriented Data Analyst to join our analytics team. You will be responsible for collecting, processing, and analyzing data to provide actionable insights that drive business decisions.

### Key Responsibilities
• Collect, clean, and analyze large datasets from multiple sources
• Create comprehensive reports and dashboards for stakeholders
• Identify trends, patterns, and anomalies in business data
• Collaborate with cross-functional teams to understand data requirements
• Develop and maintain automated reporting processes
• Present findings and recommendations to management

### Required Skills & Qualifications
• 2+ years of experience in data analysis or related field
• Proficiency in SQL for data extraction and manipulation
• Experience with data visualization tools (Tableau, Power BI, or similar)
• Strong analytical and problem-solving skills
• Knowledge of statistical analysis and methods
• Proficiency in Excel and Google Sheets
• Excellent communication and presentation skills

### Preferred Qualifications
• Experience with Python or R for data analysis
• Knowledge of machine learning concepts
• Familiarity with cloud data platforms (AWS, GCP, Azure)
• Experience with ETL processes and data warehousing
• Background in business intelligence tools

### Tools & Technologies
• SQL, Python, R
• Tableau, Power BI
• Excel, Google Sheets
• AWS/GCP data services
• Git for version control

### What We Offer
• Competitive salary and benefits
• Opportunities to work with cutting-edge data technologies
• Professional development and training programs
• Collaborative and data-driven culture
• Flexible work environment

*Equal Opportunity Employer*`,
          skills: ['SQL', 'Python', 'R', 'Tableau', 'Power BI', 'Excel', 'Statistical Analysis', 'Data Visualization', 'ETL', 'Machine Learning', 'AWS', 'Google Analytics', 'Business Intelligence']
        }
      };

      const normalizedRole = roleTitle.toLowerCase().trim();
      let jobData = jobDescriptions[normalizedRole as keyof typeof jobDescriptions];

      if (!jobData) {
        // Generate a generic job description for unknown roles
        jobData = {
          description: `## ${roleTitle}

**Company:** ${companyName || 'Our Company'}
**Employment Type:** Full-Time
**Location:** Remote/Hybrid

### Job Summary
We are seeking a qualified ${roleTitle} to join our growing team. This role offers an excellent opportunity to contribute to our organization's success and advance your career.

### Key Responsibilities
• Execute role-specific tasks and projects effectively
• Collaborate with team members to achieve departmental goals
• Maintain high standards of quality and professionalism
• Contribute to continuous improvement initiatives
• Support company objectives and values

### Required Skills & Qualifications
• Relevant experience in ${roleTitle.toLowerCase()} or related field
• Strong communication and interpersonal skills
• Problem-solving and analytical abilities
• Team collaboration and leadership potential
• Adaptability and willingness to learn

### What We Offer
• Competitive compensation package
• Professional development opportunities
• Collaborative work environment
• Growth potential within the organization

*Equal Opportunity Employer*`,
          skills: ['Communication', 'Problem Solving', 'Team Collaboration', 'Leadership', 'Analytical Skills', 'Project Management']
        };
      }

      setCurrentJobData({
        title: roleTitle,
        description: jobData.description,
        skills: jobData.skills
      });

      const responseMessage = `Perfect! I've generated a comprehensive job description for **${roleTitle}** at ${companyName || 'your company'}. 

**Key Skills Identified:**
${jobData.skills.map(skill => `• ${skill}`).join('\n')}

**What's included in the JD:**
✅ Detailed job summary and responsibilities
✅ Required and preferred qualifications  
✅ Tools and technologies
✅ Company benefits and culture

Would you like me to:
1. **Apply this JD** to your job posting form
2. **Modify** any sections or requirements
3. **Add more specific skills** or qualifications
4. **Generate a different version** for this role

Once you're happy with the JD, you can start receiving and analyzing candidate resumes!`;

      addMessage('assistant', responseMessage, { jobData });
      setConversationState('jd_ready');

    } catch (error) {
      addMessage('assistant', 'I apologize, but I encountered an error while generating the job description. Please try again or provide more details about the role.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isProcessing) return;

    const userMessage = currentInput.trim();
    addMessage('user', userMessage);
    setCurrentInput('');

    if (conversationState === 'initial') {
      addMessage('assistant', `Great! Let me create a detailed job description for **${userMessage}**. This will take just a moment... 🔄`);
      await generateJobDescription(userMessage);
    } else if (conversationState === 'jd_ready') {
      if (userMessage.toLowerCase().includes('apply') || userMessage.toLowerCase().includes('use')) {
        if (currentJobData && onJobDescriptionGenerated) {
          onJobDescriptionGenerated(currentJobData.description, currentJobData.title, currentJobData.skills);
          addMessage('assistant', `Excellent! I've applied the job description to your posting form. The JD for **${currentJobData.title}** is now ready to be published.\n\n🎯 **Next Steps:**\n• Review and publish your job posting\n• Share the application link with candidates\n• I'll help analyze incoming resumes against the ${currentJobData.skills.length} key skills we identified\n\nFeel free to ask me to generate another JD or modify this one!`);
        }
      } else if (userMessage.toLowerCase().includes('modify') || userMessage.toLowerCase().includes('change')) {
        addMessage('assistant', 'I\'d be happy to modify the job description! What specific changes would you like me to make? For example:\n\n• Add or remove specific skills\n• Adjust experience requirements\n• Modify responsibilities\n• Change location or employment type\n• Update company benefits\n\nJust let me know what you\'d like to change!');
      } else if (userMessage.toLowerCase().includes('different') || userMessage.toLowerCase().includes('regenerate')) {
        addMessage('assistant', 'I can generate a different version! Would you like me to:\n\n• Create a more **senior-level** version of this role\n• Generate a **junior/entry-level** version\n• Focus on different **technical skills**\n• Emphasize **leadership responsibilities**\n• Create a **remote-first** version\n\nOr tell me specifically what aspects you\'d like me to change!');
      } else {
        addMessage('assistant', 'I understand you\'d like to make some adjustments. Could you be more specific about what you\'d like me to modify in the job description? I can help with:\n\n• Skills and qualifications\n• Job responsibilities\n• Experience requirements\n• Company benefits\n• Technical requirements\n\nOr if you\'re ready, just say "apply this JD" and I\'ll add it to your job posting form!');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const applyJobDescription = () => {
    if (currentJobData && onJobDescriptionGenerated) {
      onJobDescriptionGenerated(currentJobData.description, currentJobData.title, currentJobData.skills);
      toast({
        title: "Job Description Applied!",
        description: `The JD for ${currentJobData.title} has been applied to your job posting form.`,
      });
    }
  };

  return (
    <Card className="shadow-soft h-[600px] flex flex-col">
      <CardHeader className="bg-gradient-card border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Recruitment Assistant
          {recruiterName && <span className="text-sm text-muted-foreground">• {recruiterName}</span>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-accent text-accent-foreground'
                }`}>
                  {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  {message.data?.jobData && (
                    <div className="mt-3 pt-3 border-t border-border/20">
                      <Button 
                        size="sm" 
                        onClick={applyJobDescription}
                        className="bg-success text-success-foreground hover:bg-success/90"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Apply This JD
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-muted-foreground ml-2">Generating job description...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                conversationState === 'initial' 
                  ? "Tell me the role you're hiring for (e.g., Senior Software Engineer)..."
                  : "Ask me to modify the JD, apply it, or generate a new one..."
              }
              className="flex-1 min-h-[40px] max-h-[100px] resize-none"
              disabled={isProcessing}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!currentInput.trim() || isProcessing}
              size="sm"
              className="px-4"
            >
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIRecruitmentAssistant;