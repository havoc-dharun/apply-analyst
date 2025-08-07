import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Wand2, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AIRecruitmentAssistant from './AIRecruitmentAssistant';

interface JobDescriptionData {
  jobTitle: string;
  department: string;
  employmentType: string;
  experienceYears: string;
  location: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredQualifications: string[];
  tools: string[];
  generatedDescription: string;
}

interface JobDescriptionGeneratorProps {
  recruiterName?: string;
  onGenerate: (description: string, title: string, company: string) => void;
  companyName: string;
}

const JobDescriptionGenerator: React.FC<JobDescriptionGeneratorProps> = ({ recruiterName, onGenerate, companyName }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<JobDescriptionData>({
    jobTitle: '',
    department: '',
    employmentType: '',
    experienceYears: '',
    location: '',
    responsibilities: [''],
    requiredSkills: [''],
    preferredQualifications: [''],
    tools: [''],
    generatedDescription: ''
  });
  const [activeTab, setActiveTab] = useState('ai-assistant');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponsibility, setCurrentResponsibility] = useState('');
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentQualification, setCurrentQualification] = useState('');
  const [currentTool, setCurrentTool] = useState('');

  const departments = [
    'Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 
    'Operations', 'Customer Support', 'Product Management', 'Design', 
    'Data & Analytics', 'Quality Assurance', 'Legal', 'IT'
  ];

  const employmentTypes = [
    'Full-Time', 'Part-Time', 'Contract', 'Internship', 'Remote', 'Hybrid'
  ];

  const experienceOptions = [
    'Entry Level (0-1 years)', '1-3 years', '3-5 years', 
    '5-8 years', '8+ years', 'Senior Level (10+ years)'
  ];

  const addToList = (list: string[], value: string, setter: React.Dispatch<React.SetStateAction<JobDescriptionData>>, key: keyof JobDescriptionData) => {
    if (value.trim()) {
      const updatedList = [...list.filter(item => item.trim()), value.trim()];
      setter(prev => ({ ...prev, [key]: updatedList }));
      return true;
    }
    return false;
  };

  const removeFromList = (list: string[], index: number, setter: React.Dispatch<React.SetStateAction<JobDescriptionData>>, key: keyof JobDescriptionData) => {
    const updatedList = list.filter((_, i) => i !== index);
    setter(prev => ({ ...prev, [key]: updatedList }));
  };

  const generateJobDescription = async () => {
    if (!formData.jobTitle || !formData.department) {
      toast({
        title: "Missing Information",
        description: "Please provide at least Job Title and Department",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation with a professional template
    const responsibilitiesList = formData.responsibilities.filter(r => r.trim()).length > 0 
      ? formData.responsibilities.filter(r => r.trim())
      : generateDefaultResponsibilities(formData.department);

    const skillsList = formData.requiredSkills.filter(s => s.trim()).length > 0
      ? formData.requiredSkills.filter(s => s.trim())
      : generateDefaultSkills(formData.department);

    const generatedJD = `## ${formData.jobTitle}

**Company:** ${companyName}
**Department:** ${formData.department}
**Employment Type:** ${formData.employmentType || 'Full-Time'}
**Experience Required:** ${formData.experienceYears || 'Entry Level'}
**Location:** ${formData.location || 'Not specified'}

### Job Summary
We are seeking a motivated ${formData.jobTitle} to join our ${formData.department} team. This role offers an excellent opportunity to contribute to our growing organization and make a meaningful impact.

### Key Responsibilities
${responsibilitiesList.map(resp => `• ${resp}`).join('\n')}

### Required Skills & Qualifications
${skillsList.map(skill => `• ${skill}`).join('\n')}

${formData.preferredQualifications.filter(q => q.trim()).length > 0 ? `### Preferred Qualifications
${formData.preferredQualifications.filter(q => q.trim()).map(qual => `• ${qual}`).join('\n')}` : ''}

${formData.tools.filter(t => t.trim()).length > 0 ? `### Tools & Technologies
${formData.tools.filter(t => t.trim()).map(tool => `• ${tool}`).join('\n')}` : ''}

### What We Offer
• Competitive salary and benefits package
• Professional development opportunities
• Collaborative and inclusive work environment
• Growth potential within the organization

*Equal Opportunity Employer*`;

    setTimeout(() => {
      setFormData(prev => ({ ...prev, generatedDescription: generatedJD }));
      setIsGenerating(false);
      toast({
        title: "Job Description Generated!",
        description: "Your professional job description is ready.",
      });
    }, 2000);
  };

  const generateDefaultResponsibilities = (department: string): string[] => {
    const responsibilities: Record<string, string[]> = {
      'Engineering': [
        'Develop and maintain software applications',
        'Write clean, efficient, and well-documented code',
        'Participate in code reviews and technical discussions',
        'Collaborate with cross-functional teams'
      ],
      'Marketing': [
        'Develop and execute marketing campaigns',
        'Analyze market trends and customer behavior',
        'Create compelling content for various channels',
        'Manage social media presence and brand awareness'
      ],
      'Sales': [
        'Generate new business opportunities',
        'Build and maintain client relationships',
        'Meet and exceed sales targets',
        'Prepare proposals and presentations'
      ],
      'Human Resources': [
        'Manage recruitment and hiring processes',
        'Develop HR policies and procedures',
        'Handle employee relations and performance management',
        'Ensure compliance with employment laws'
      ]
    };
    return responsibilities[department] || [
      'Execute department-specific tasks and projects',
      'Collaborate with team members to achieve goals',
      'Maintain professional standards and quality',
      'Contribute to continuous improvement initiatives'
    ];
  };

  const generateDefaultSkills = (department: string): string[] => {
    const skills: Record<string, string[]> = {
      'Engineering': ['Programming languages', 'Problem-solving skills', 'Version control (Git)', 'Agile methodologies'],
      'Marketing': ['Digital marketing', 'Content creation', 'Analytics tools', 'Creative thinking'],
      'Sales': ['Communication skills', 'CRM software', 'Negotiation abilities', 'Customer relationship management'],
      'Human Resources': ['HR management systems', 'Employment law knowledge', 'Recruitment strategies', 'Interpersonal skills']
    };
    return skills[department] || ['Strong communication skills', 'Team collaboration', 'Problem-solving', 'Attention to detail'];
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formData.generatedDescription);
      toast({
        title: "Copied to clipboard!",
        description: "Job description copied successfully.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const useForPosting = () => {
    onGenerate(formData.generatedDescription, formData.jobTitle, companyName);
    toast({
      title: "Job Description Applied!",
      description: "The generated description is now ready for posting.",
    });
  };

  const handleAIJobDescriptionGenerated = (description: string, title: string, skills: string[]) => {
    setFormData(prev => ({
      ...prev,
      jobTitle: title,
      generatedDescription: description
    }));
    setActiveTab('manual-entry');
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="bg-gradient-card">
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          AI Job Description Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="manual-entry">Manual Entry</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai-assistant" className="mt-6">
            <AIRecruitmentAssistant
              recruiterName={recruiterName}
              companyName={companyName}
              onJobDescriptionGenerated={handleAIJobDescriptionGenerated}
            />
          </TabsContent>
          
          <TabsContent value="manual-entry" className="space-y-6 mt-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
              placeholder="e.g., Senior Software Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment Type</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, employmentType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {employmentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="experience">Experience Level</Label>
            <Select onValueChange={(value) => setFormData(prev => ({ ...prev, experienceYears: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent>
                {experienceOptions.map(exp => (
                  <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., New York, NY / Remote / Hybrid"
          />
        </div>

        <Separator />

        {/* Dynamic Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Responsibilities */}
          <div className="space-y-3">
            <Label>Key Responsibilities</Label>
            <div className="flex gap-2">
              <Input
                value={currentResponsibility}
                onChange={(e) => setCurrentResponsibility(e.target.value)}
                placeholder="Add responsibility..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (addToList(formData.responsibilities, currentResponsibility, setFormData, 'responsibilities')) {
                      setCurrentResponsibility('');
                    }
                  }
                }}
              />
              <Button 
                size="sm" 
                onClick={() => {
                  if (addToList(formData.responsibilities, currentResponsibility, setFormData, 'responsibilities')) {
                    setCurrentResponsibility('');
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {formData.responsibilities.filter(r => r.trim()).map((resp, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{resp}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromList(formData.responsibilities, index, setFormData, 'responsibilities')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-3">
            <Label>Required Skills</Label>
            <div className="flex gap-2">
              <Input
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                placeholder="Add skill..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (addToList(formData.requiredSkills, currentSkill, setFormData, 'requiredSkills')) {
                      setCurrentSkill('');
                    }
                  }
                }}
              />
              <Button 
                size="sm" 
                onClick={() => {
                  if (addToList(formData.requiredSkills, currentSkill, setFormData, 'requiredSkills')) {
                    setCurrentSkill('');
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {formData.requiredSkills.filter(s => s.trim()).map((skill, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{skill}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromList(formData.requiredSkills, index, setFormData, 'requiredSkills')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preferred Qualifications */}
          <div className="space-y-3">
            <Label>Preferred Qualifications (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={currentQualification}
                onChange={(e) => setCurrentQualification(e.target.value)}
                placeholder="Add qualification..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (addToList(formData.preferredQualifications, currentQualification, setFormData, 'preferredQualifications')) {
                      setCurrentQualification('');
                    }
                  }
                }}
              />
              <Button 
                size="sm" 
                onClick={() => {
                  if (addToList(formData.preferredQualifications, currentQualification, setFormData, 'preferredQualifications')) {
                    setCurrentQualification('');
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {formData.preferredQualifications.filter(q => q.trim()).map((qual, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{qual}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromList(formData.preferredQualifications, index, setFormData, 'preferredQualifications')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Tools & Technologies */}
          <div className="space-y-3">
            <Label>Tools & Technologies (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={currentTool}
                onChange={(e) => setCurrentTool(e.target.value)}
                placeholder="Add tool..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (addToList(formData.tools, currentTool, setFormData, 'tools')) {
                      setCurrentTool('');
                    }
                  }
                }}
              />
              <Button 
                size="sm" 
                onClick={() => {
                  if (addToList(formData.tools, currentTool, setFormData, 'tools')) {
                    setCurrentTool('');
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {formData.tools.filter(t => t.trim()).map((tool, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{tool}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromList(formData.tools, index, setFormData, 'tools')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={generateJobDescription} 
            disabled={isGenerating}
            className="px-8"
          >
            {isGenerating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Job Description
              </>
            )}
          </Button>
        </div>

        {/* Generated Description */}
        {formData.generatedDescription && (
          <div className="space-y-4">
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Generated Job Description</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button size="sm" onClick={useForPosting}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Use for Posting
                  </Button>
                </div>
              </div>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {formData.generatedDescription}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default JobDescriptionGenerator;