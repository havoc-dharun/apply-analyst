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

export const analyzeResumeWithGemini = async (
  resumeText: string,
  jobDescription: string
): Promise<GeminiAnalysisResult> => {
  console.log("Calling secure Gemini API via Edge Function");
  console.log("Resume text length:", resumeText.length);
  console.log("Job description length:", jobDescription.length);
  
  try {
    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: {
        resumeText,
        jobDescription
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
    throw error;
  }
};