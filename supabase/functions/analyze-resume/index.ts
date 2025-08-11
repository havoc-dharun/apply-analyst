import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiAnalysisResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  recommendation: "Shortlist for Next Round" | "Consider with Caution" | "Reject";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription, keywords = [] } = await req.json();
    
    if (!resumeText || !jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: resumeText and jobDescription' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
    
    // Extract keywords from job description if not provided
    const extractedKeywords = keywords.length > 0 ? keywords : extractKeywordsFromDescription(jobDescription);
    const keywordsText = extractedKeywords.length > 0 ? `\n\nREQUIRED KEYWORDS FOR ANALYSIS: ${extractedKeywords.join(', ')}` : '';
    
    const prompt = `You are an intelligent HR assistant trained to evaluate job applications.

Compare the following candidate's resume with the given job description and provide a detailed analysis.

Resume:
${resumeText}

Job Description:
${jobDescription}${keywordsText}

IMPORTANT: Pay special attention to the REQUIRED KEYWORDS listed above. These are the most important skills and technologies for this role.

ANALYSIS INSTRUCTIONS:
1. FIRST: Extract ALL skills, technologies, and qualifications mentioned in the candidate's resume
2. SECOND: Compare these extracted skills with the job requirements and keywords
3. THIRD: Identify which skills match and which are missing
4. FOURTH: Calculate a realistic match score based on role relevance

ROLE CONTEXT ANALYSIS:
- If this is an HR/Marketing/Non-technical role, technical skills (programming, coding) should NOT be considered as relevant matches
- If this is a technical role, HR/Marketing skills should NOT be considered as relevant matches
- Focus on role-specific skills and experience

Analyze the content and return ONLY a valid JSON response in this exact format:
{
  "matchScore": [number from 0 to 100 based on skills match, experience relevance, and keyword presence],
  "matchedSkills": ["skill1", "skill2", "skill3"],
  "missingSkills": ["missing1", "missing2", "missing3"],
  "summary": "2-3 sentence objective summary of candidate fit",
  "recommendation": "Shortlist for Next Round" | "Consider with Caution" | "Reject"
}

Scoring Guidelines:
- 90-100: Perfect match with all required skills and experience
- 80-89: Strong match with most required skills
- 70-79: Good match with some gaps in skills
- 60-69: Moderate match with significant skill gaps
- 50-59: Weak match, consider with caution
- Below 50: Poor match, likely reject

ROLE MISMATCH PENALTIES:
- HR/Marketing role with only technical skills: -40 points
- Technical role with only HR/Marketing skills: -40 points
- Missing critical required keywords: -25 points each

SKILL EXTRACTION: Extract skills from the actual resume content, not from predefined lists. Look for:
- Programming languages, frameworks, tools mentioned in the resume
- Industry-specific skills (HR, Marketing, Finance, etc.)
- Certifications, education, and experience areas
- Technologies and platforms mentioned

Be objective and focus on role-specific qualifications, experience, and skills.`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    console.log("Making request to Gemini API...");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error response:", errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", generatedText);
      throw new Error("No valid JSON found in Gemini response");
    }

    const result = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!result.matchScore || !result.summary || !result.recommendation) {
      console.error("Invalid response structure:", result);
      throw new Error("Invalid response structure from Gemini");
    }

    const analysisResult: GeminiAnalysisResult = {
      matchScore: Math.min(100, Math.max(0, result.matchScore)),
      matchedSkills: result.matchedSkills || [],
      missingSkills: result.missingSkills || [],
      summary: result.summary,
      recommendation: result.recommendation,
    };

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in analyze-resume function:", error);
    
    // Fallback analysis
    const { resumeText, jobDescription } = await req.json();
    const fallbackResult = generateFallbackAnalysis(resumeText, jobDescription);
    
    return new Response(
      JSON.stringify(fallbackResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to extract keywords from job description
function extractKeywordsFromDescription(description: string): string[] {
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
  
  // HR and Marketing keywords
  const hrKeywords = ['human resources', 'hr', 'recruitment', 'hiring', 'talent acquisition', 'employee relations'];
  hrKeywords.forEach(keyword => {
    if (descriptionLower.includes(keyword)) {
      keywords.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  });
  
  return keywords;
}

// Fallback analysis function
function generateFallbackAnalysis(resumeText: string, jobDescription: string): GeminiAnalysisResult {
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();
  
  let score = 50; // Base score
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  
  // Basic keyword matching
  const extractedKeywords = extractKeywordsFromDescription(jobDescription);
  
  extractedKeywords.forEach(keyword => {
    if (resumeLower.includes(keyword.toLowerCase())) {
      score += 10;
      matchedSkills.push(keyword);
    } else {
      score -= 5;
      missingSkills.push(keyword);
    }
  });
  
  // Experience check
  if (resumeLower.includes('senior') || resumeLower.includes('lead')) {
    score += 10;
  }
  
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
    summary: `Fallback analysis shows ${score >= 70 ? 'good' : 'moderate'} potential match with job requirements.`,
    recommendation
  };
}