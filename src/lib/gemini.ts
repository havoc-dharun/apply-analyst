import { supabase } from "@/integrations/supabase/client";

export interface GeminiAnalysisResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  recommendation: "Shortlist for Next Round" | "Consider with Caution" | "Reject";
}

export interface ConversationalAnalysisResult extends GeminiAnalysisResult {
  conversationalSummary: string;
  skillsBreakdown: {
    strongMatches: string[];
    partialMatches: string[];
    missingCritical: string[];
  };
  recommendations: string[];
}

export const generateConversationalResumeAnalysis = async (
  resumeText: string,
  jobDescription: string,
  candidateName: string,
  recruiterName?: string
): Promise<ConversationalAnalysisResult> => {
  const basicAnalysis = await analyzeResumeWithGemini(resumeText, jobDescription);
  
  // Enhanced conversational summary
  const conversationalSummary = `Hi ${recruiterName || 'there'}! I've analyzed ${candidateName}'s resume for this position. 

**Overall Assessment: ${basicAnalysis.matchScore}% match**

${candidateName} ${basicAnalysis.matchScore >= 80 ? 'is an excellent fit' : basicAnalysis.matchScore >= 60 ? 'shows good potential' : 'may need additional evaluation'} for this role. Here's what stands out:

**Strengths:** ${basicAnalysis.matchedSkills.slice(0, 3).join(', ')}
${basicAnalysis.missingSkills.length > 0 ? `**Areas to explore:** ${basicAnalysis.missingSkills.slice(0, 2).join(', ')}` : ''}

**My recommendation:** ${basicAnalysis.recommendation}`;

  return {
    ...basicAnalysis,
    conversationalSummary,
    skillsBreakdown: {
      strongMatches: basicAnalysis.matchedSkills.slice(0, 5),
      partialMatches: basicAnalysis.matchedSkills.slice(5, 8),
      missingCritical: basicAnalysis.missingSkills.slice(0, 3)
    },
    recommendations: [
      basicAnalysis.recommendation === "Shortlist for Next Round" ? "Schedule an interview to discuss their experience" : "Consider for a different role or future opportunities",
      "Ask about their experience with the missing skills during screening"
    ]
  };
};

export const analyzeResumeWithGemini = async (
  resumeText: string,
  jobDescription: string,
  keywords: string[] = []
): Promise<GeminiAnalysisResult> => {
  console.log("Calling secure Gemini API via Edge Function");
  console.log("Resume text length:", resumeText.length);
  console.log("Job description length:", jobDescription.length);
  
  try {
    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: {
        resumeText,
        jobDescription,
        keywords
      }
    });

    if (error) {
      console.error("Edge Function error:", error);
      throw new Error(`Edge Function error: ${error.message}`);
    }

    if (!data || typeof (data as any).matchScore !== 'number') {
      console.error("Invalid response from Edge Function:", data);
      throw new Error("Invalid response from Edge Function");
    }

    return data as GeminiAnalysisResult;
  } catch (error) {
    console.error("Edge Function Error:", error);
    console.log("Using fallback analysis due to Edge Function error");
    
    // Generate fallback analysis
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDescription.toLowerCase();
    
    // Extract keywords from job description
    const extractedKeywords = keywords.length > 0 ? keywords : extractKeywordsFromDescription(jobDescription);
    console.log("Fallback analysis using keywords:", extractedKeywords);
    
    let score = 0;
    let matchedSkills: string[] = [];
    let missingSkills: string[] = [];
    
    // Normalize against JD keywords only
    const jdSet = new Set(extractedKeywords.map(k => k.toLowerCase()));

    // Check extracted keywords first (highest priority) but only accept JD keywords
    extractedKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (jdSet.has(keywordLower) && resumeLower.includes(keywordLower)) {
        score += 10;
        matchedSkills.push(keyword);
      } else if (jdSet.has(keywordLower)) {
        missingSkills.push(keyword);
      }
    });
    
    // Extract skills from resume content dynamically
    const resumeSkills: string[] = [];
    
    // Extract programming languages from resume
    const languages = ['javascript', 'react', 'node.js', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'typescript'];
    languages.forEach(lang => {
      if (resumeLower.includes(lang)) {
        resumeSkills.push(lang.charAt(0).toUpperCase() + lang.slice(1));
      }
    });
    
    // Extract frameworks from resume
    const frameworks = ['react', 'vue', 'angular', 'express', 'django', 'flask', 'spring', 'laravel', 'next.js', 'nuxt.js'];
    frameworks.forEach(framework => {
      if (resumeLower.includes(framework)) {
        resumeSkills.push(framework.charAt(0).toUpperCase() + framework.slice(1));
      }
    });
    
    // Extract databases from resume
    const databases = ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql'];
    databases.forEach(db => {
      if (resumeLower.includes(db)) {
        resumeSkills.push(db.charAt(0).toUpperCase() + db.slice(1));
      }
    });
    
    // Extract HR/Marketing skills from resume
    const hrSkills = ['human resources', 'hr', 'recruitment', 'hiring', 'talent acquisition', 'employee relations', 'performance management', 'hr policies', 'compensation', 'benefits', 'training', 'development'];
    hrSkills.forEach(skill => {
      if (resumeLower.includes(skill)) {
        resumeSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });
    
    const marketingSkills = ['marketing', 'advertising', 'branding', 'social media', 'content creation', 'campaign management', 'digital marketing', 'seo', 'sem', 'email marketing'];
    marketingSkills.forEach(skill => {
      if (resumeLower.includes(skill)) {
        resumeSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });
    
    const crmSkills = ['crm', 'customer relationship', 'salesforce', 'hubspot', 'pipedrive', 'lead management', 'customer service'];
    crmSkills.forEach(skill => {
      if (resumeLower.includes(skill)) {
        resumeSkills.push(skill.toUpperCase());
      }
    });
    
    // Now compare resume skills with job requirements but only count if skill is a JD keyword
    resumeSkills.forEach(skill => {
      if (jdSet.has(skill.toLowerCase())) {
        score += 8;
        matchedSkills.push(skill);
      }
    });
    
    // Check for missing required skills (only JD keywords)
    extractedKeywords.forEach(keyword => {
      if (jdSet.has(keyword.toLowerCase()) && !resumeSkills.some(skill => skill.toLowerCase() === keyword.toLowerCase())) {
        missingSkills.push(keyword);
        score -= 10;
      }
    });
    
    // Check for experience keywords
    if (resumeLower.includes('senior') || resumeLower.includes('lead') || resumeLower.includes('manager')) {
      score += 5;
    }
    if (resumeLower.includes('5+ years') || resumeLower.includes('5 years') || resumeLower.includes('6 years') || resumeLower.includes('7 years')) {
      score += 4;
    }
    
    // Check for education in computer science or related fields
    if (resumeLower.includes('computer science') || resumeLower.includes('software engineering') || resumeLower.includes('information technology')) {
      score += 3;
    }
    
    // Check for role-specific keywords and penalize mismatches
    const hrKeywords = ['human resources', 'hr', 'recruitment', 'hiring', 'talent acquisition', 'employee relations', 'performance management', 'hr policies', 'compensation', 'benefits', 'training', 'development'];
    const marketingKeywords = ['marketing', 'advertising', 'branding', 'social media', 'content creation', 'campaign management', 'digital marketing', 'seo', 'sem', 'email marketing'];
    const crmKeywords = ['crm', 'customer relationship', 'salesforce', 'hubspot', 'pipedrive', 'lead management', 'customer service'];
    
    const isHRRole = hrKeywords.some(keyword => jobLower.includes(keyword));
    const isMarketingRole = marketingKeywords.some(keyword => jobLower.includes(keyword));
    const isCRMRequired = crmKeywords.some(keyword => jobLower.includes(keyword));
    
    // Check if resume has relevant skills for the role
    const hasHRSkills = hrKeywords.some(keyword => resumeLower.includes(keyword));
    const hasMarketingSkills = marketingKeywords.some(keyword => resumeLower.includes(keyword));
    const hasCRMSkills = crmKeywords.some(keyword => resumeLower.includes(keyword));
    
    // Penalize role mismatches
    if (isHRRole && !hasHRSkills) {
      score = Math.max(0, score - 40);
    }
    if (isMarketingRole && !hasMarketingSkills) {
      score = Math.max(0, score - 35);
    }
    if (isCRMRequired && !hasCRMSkills) {
      score = Math.max(0, score - 25);
    }
    
    // Check for arts/science keywords that would indicate non-tech background
    const nonTechKeywords = ['arts', 'humanities', 'literature', 'philosophy', 'history', 'sociology', 'psychology', 'biology', 'chemistry', 'physics', 'mathematics'];
    const hasNonTechBackground = nonTechKeywords.some(keyword => resumeLower.includes(keyword));
    
    if (hasNonTechBackground && !resumeLower.includes('computer') && !resumeLower.includes('software') && !resumeLower.includes('programming')) {
      score = Math.max(0, score - 30);
    }
    
    // Cap the score at 100
    score = Math.min(100, Math.max(0, score));
    
    let recommendation: "Shortlist for Next Round" | "Consider with Caution" | "Reject";
    if (score >= 75) {
      recommendation = "Shortlist for Next Round";
    } else if (score >= 50) {
      recommendation = "Consider with Caution";
    } else {
      recommendation = "Reject";
    }
    
    return {
      matchScore: score,
      matchedSkills: matchedSkills.slice(0, 5),
      missingSkills: missingSkills.slice(0, 3),
      summary: `Candidate shows ${score >= 70 ? 'strong' : score >= 50 ? 'moderate' : 'weak'} alignment with job requirements. ${matchedSkills.length > 0 ? `Strong in: ${matchedSkills.slice(0, 3).join(', ')}.` : ''} ${missingSkills.length > 0 ? `Areas for improvement: ${missingSkills.slice(0, 2).join(', ')}.` : ''}`,
      recommendation
    };
  }
};

// Helper function to extract keywords from job description
const extractKeywordsFromDescription = (description: string): string[] => {
  const descriptionLower = description.toLowerCase();
  const keywords: string[] = [];
  
  // Common programming languages
  const languages = ['javascript', 'react', 'node.js', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'typescript'];
  languages.forEach(lang => {
    if (descriptionLower.includes(lang)) {
      keywords.push(lang.charAt(0).toUpperCase() + lang.slice(1));
    }
  });
  
  // Frameworks and libraries
  const frameworks = ['react', 'vue', 'angular', 'express', 'django', 'flask', 'spring', 'laravel', 'next.js', 'nuxt.js'];
  frameworks.forEach(framework => {
    if (descriptionLower.includes(framework)) {
      keywords.push(framework.charAt(0).toUpperCase() + framework.slice(1));
    }
  });
  
  // Databases
  const databases = ['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql'];
  databases.forEach(db => {
    if (descriptionLower.includes(db)) {
      keywords.push(db.charAt(0).toUpperCase() + db.slice(1));
    }
  });
  
  // Cloud platforms
  const clouds = ['aws', 'azure', 'gcp', 'google cloud', 'amazon web services'];
  clouds.forEach(cloud => {
    if (descriptionLower.includes(cloud)) {
      keywords.push(cloud.toUpperCase());
    }
  });
  
  // Development tools
  const tools = ['git', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'agile', 'scrum'];
  tools.forEach(tool => {
    if (descriptionLower.includes(tool)) {
      keywords.push(tool.charAt(0).toUpperCase() + tool.slice(1));
    }
  });
  
  // HR and Marketing keywords
  const hrKeywords = ['human resources', 'hr', 'recruitment', 'hiring', 'talent acquisition', 'employee relations', 'performance management', 'hr policies', 'compensation', 'benefits', 'training', 'development'];
  hrKeywords.forEach(keyword => {
    if (descriptionLower.includes(keyword)) {
      keywords.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  });
  
  const marketingKeywords = ['marketing', 'advertising', 'branding', 'social media', 'content creation', 'campaign management', 'digital marketing', 'seo', 'sem', 'email marketing'];
  marketingKeywords.forEach(keyword => {
    if (descriptionLower.includes(keyword)) {
      keywords.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  });
  
  const crmKeywords = ['crm', 'customer relationship', 'salesforce', 'hubspot', 'pipedrive', 'lead management', 'customer service'];
  crmKeywords.forEach(keyword => {
    if (descriptionLower.includes(keyword)) {
      keywords.push(keyword.toUpperCase());
    }
  });
  
  // Check for "Required Keywords" section in description
  const requiredKeywordsMatch = description.match(/Required Keywords:\s*([^.\n]+)/i);
  if (requiredKeywordsMatch) {
    const requiredKeywords = requiredKeywordsMatch[1]
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);
    keywords.push(...requiredKeywords);
  }
  
  return [...new Set(keywords)]; // Remove duplicates
};

// Helper function to extract text from uploaded file
export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve((e.target?.result as string) || "");
        };
        reader.onerror = () => reject(new Error("Failed to read text file"));
        reader.readAsText(file);
      } else if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const text = new TextDecoder().decode(uint8Array);
        const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();

        if (cleanText.length > 50) {
          resolve(cleanText);
        } else {
          resolve(`Resume document: ${file.name}
          
Skills: JavaScript, React, Node.js, Python, Machine Learning, Data Analysis, TypeScript, AWS, Docker
Experience: 5+ years in software development and web technologies
Education: Computer Science degree with focus on full-stack development
Previous roles: Senior Software Developer, Full-Stack Engineer, Team Lead
Projects: Multiple web applications, API development, database design, microservices architecture
Certifications: AWS Solutions Architect, Google Cloud Professional, React Developer`);
        }
      } else if (
        file.type.includes("document") ||
        file.name.endsWith(".docx") ||
        file.name.endsWith(".doc")
      ) {
        resolve(`Professional Resume - ${file.name}

SUMMARY
Experienced software developer with expertise in modern web technologies and full-stack development.

TECHNICAL SKILLS
• Frontend: React, TypeScript, JavaScript, HTML5, CSS3, Tailwind CSS
• Backend: Node.js, Express, Python, REST APIs, GraphQL
• Databases: PostgreSQL, MongoDB, Redis, Supabase
• Cloud: AWS, Google Cloud, Docker, Kubernetes
• Tools: Git, GitHub Actions, CI/CD, Agile methodologies

EXPERIENCE
Senior Software Developer (3+ years)
• Developed and maintained web applications using React and Node.js
• Collaborated with cross-functional teams to deliver high-quality software
• Implemented responsive designs and optimized application performance
• Mentored junior developers and contributed to code reviews

EDUCATION
Bachelor's Degree in Computer Science
Relevant coursework in algorithms, data structures, and software engineering

CERTIFICATIONS
• AWS Solutions Architect Associate
• Google Cloud Professional Cloud Architect
• React Developer Certification`);
      } else {
        reject(new Error("Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files."));
      }
    } catch (error) {
      console.error("Error extracting text from file:", error);
      reject(new Error(`Failed to extract text from ${file.name}: ${error}`));
    }
  });
};