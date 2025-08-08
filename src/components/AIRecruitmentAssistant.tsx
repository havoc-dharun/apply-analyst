import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, User, Wand2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
      id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
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
      const { data, error } = await supabase.functions.invoke('generate-jd', {
        body: { roleTitle, companyName }
      });
      if (error) throw error;

      const jd = (data as any) ?? {};
      const title = jd.title || roleTitle;
      const description = jd.description as string;
      const skills: string[] = Array.isArray(jd.skills) ? jd.skills : [];

      if (!description) throw new Error('Invalid response from Gemini');

      setCurrentJobData({ title, description, skills });

      const responseMessage = `Perfect! I've generated a comprehensive job description for **${title}** at ${companyName || 'your company'}. \n\n**Key Skills Identified:**\n${skills.map((s: string) => `• ${s}`).join('\n')}\n\n**What's included in the JD:**\n✅ Detailed job summary and responsibilities\n✅ Required and preferred qualifications  \n✅ Tools and technologies\n✅ Company benefits and culture\n\nWould you like me to:\n1. **Apply this JD** to your job posting form\n2. **Modify** any sections or requirements\n3. **Add more specific skills** or qualifications\n4. **Generate a different version** for this role\n\nOnce you're happy with the JD, you can start receiving and analyzing candidate resumes!`;

      addMessage('assistant', responseMessage, { jobData: { description, skills } });
      setConversationState('jd_ready');
    } catch (err) {
      // Fallback JD if Gemini call fails
      const fallbackDesc = `## ${roleTitle}\n\n**Company:** ${companyName || 'Our Company'}\n**Employment Type:** Full-Time\n**Location:** Remote/Hybrid\n\n### Job Summary\nWe are seeking a qualified ${roleTitle} to join our growing team.\n\n### Key Responsibilities\n• Execute role-specific tasks and projects effectively\n• Collaborate with team members to achieve departmental goals\n• Maintain high standards of quality and professionalism\n\n### Required Skills & Qualifications\n• Communication\n• Problem Solving\n• Team Collaboration\n• Leadership\n\n### What We Offer\n• Competitive compensation package\n• Professional development opportunities\n• Collaborative work environment\n\n*Equal Opportunity Employer*`;
      const fallbackSkills = ['Communication', 'Problem Solving', 'Team Collaboration', 'Leadership'];
      setCurrentJobData({ title: roleTitle, description: fallbackDesc, skills: fallbackSkills });
      addMessage('assistant', `I couldn't reach Gemini right now, so I created a solid starter JD for **${roleTitle}**. You can apply it or ask me to refine it.`, { jobData: { description: fallbackDesc, skills: fallbackSkills } });
      setConversationState('jd_ready');
      toast({ title: 'Temporary fallback used', description: 'Gemini API was unreachable. Using a basic JD.', variant: 'destructive' });
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