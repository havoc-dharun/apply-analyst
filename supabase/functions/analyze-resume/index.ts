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
    if (typeof result.matchScore !== 'number' || !result.summary || !result.recommendation) {
      console.error("Invalid response structure:", result);
      throw new Error("Invalid response structure from Gemini");
    }

    // Normalize skills strictly against JD keywords to avoid generic matches like Git leaking in
    const jdKeywords = extractKeywordsFromDescription(jobDescription).map((k) => k.toLowerCase());
    const jdSet = new Set(jdKeywords);

    const toLowerArray = (arr: any) => Array.isArray(arr) ? arr.map((s) => String(s).toLowerCase()) : [];
    const uniq = (arr: string[]) => Array.from(new Set(arr));
    const toTitle = (s: string) => s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;

    const rawMatched = toLowerArray(result.matchedSkills).filter((s) => jdSet.has(s));
    const rawMissing = toLowerArray(result.missingSkills).filter((s) => jdSet.has(s) && !rawMatched.includes(s));

    const matchedSkills = uniq(rawMatched).map(toTitle).slice(0, 5);
    const missingSkills = uniq(rawMissing).map(toTitle).slice(0, 3);
    
    const analysisResult: GeminiAnalysisResult = {
      matchScore: Math.min(100, Math.max(0, result.matchScore)),
      matchedSkills,
      missingSkills,
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

  // Extract JD keywords and resume skills
  const jdKeywords = extractKeywordsFromDescription(jobDescription).map(k => k.toLowerCase());
  const resumeTerms = new Set<string>();

  const knownTerms = [
    'javascript','typescript','react','node.js','python','java','c++','c#','php','ruby','go','rust','vue','angular','express','django','flask','spring','laravel','next.js','nuxt.js','mysql','postgresql','mongodb','redis','sqlite','oracle','sql','aws','azure','gcp','google cloud','amazon web services','git','docker','kubernetes','jenkins','ci/cd','agile','scrum',
    'human resources','hr','recruitment','hiring','talent acquisition','employee relations','performance management','hr policies','compensation','benefits','training','development',
    'marketing','advertising','branding','social media','content creation','campaign management','digital marketing','seo','sem','email marketing','crm','customer relationship','salesforce','hubspot','pipedrive','lead management','customer service'
  ];
  for (const term of knownTerms) {
    if (resumeLower.includes(term)) resumeTerms.add(term);
  }

  // JD coverage (recall): how much of the JD the CV covers
  const jdCovered = jdKeywords.filter(k => resumeLower.includes(k)).length;
  const recall = jdKeywords.length > 0 ? jdCovered / jdKeywords.length : 0;

  // CV relevance (precision): how much of the CV’s detected skills are relevant to the JD
  const resumeSkillList = Array.from(resumeTerms);
  const relevantInCv = resumeSkillList.filter(s => jdKeywords.includes(s)).length;
  const precision = resumeSkillList.length > 0 ? relevantInCv / resumeSkillList.length : (jdKeywords.length > 0 ? 0 : 1);

  // F1-like score to balance precision and recall
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // Base score from F1
  let score = Math.round(f1 * 100);

  // Role mismatch penalties
  const isHRRole = ['human resources','hr','recruitment','hiring','talent acquisition','employee relations','performance management'].some(k => jobLower.includes(k));
  const isMarketingRole = ['marketing','advertising','branding','social media','content creation','campaign management','digital marketing','seo','sem','email marketing'].some(k => jobLower.includes(k));
  const isTechnicalRole = ['javascript','typescript','react','node.js','python','java','c++','c#','php','ruby','go','rust'].some(k => jobLower.includes(k));

  const hasHR = ['human resources','hr','recruitment','hiring','talent acquisition','employee relations','performance management'].some(k => resumeLower.includes(k));
  const hasMarketing = ['marketing','advertising','branding','social media','content creation','campaign management','digital marketing','seo','sem','email marketing'].some(k => resumeLower.includes(k));
  const hasTech = ['javascript','typescript','react','node.js','python','java','c++','c#','php','ruby','go','rust'].some(k => resumeLower.includes(k));

  if (isTechnicalRole && !hasTech) score = Math.max(0, score - 35);
  if ((isHRRole || isMarketingRole) && hasTech && !hasHR && !hasMarketing) score = Math.max(0, score - 25);

  // Experience nudges
  if (resumeLower.includes('senior') || resumeLower.includes('lead') || resumeLower.includes('manager')) score += 5;
  if (resumeLower.match(/\b(5\+?\s*years|5\s*years|6\s*years|7\s*years)\b/)) score += 3;

  score = Math.min(100, Math.max(0, score));

  // Matched/missing skills lists from JD perspective
  const matchedSkills = jdKeywords.filter(k => resumeLower.includes(k)).slice(0, 5).map(k => k[0].toUpperCase() + k.slice(1));
  const missingSkills = jdKeywords.filter(k => !resumeLower.includes(k)).slice(0, 3).map(k => k[0].toUpperCase() + k.slice(1));

  let recommendation: "Shortlist for Next Round" | "Consider with Caution" | "Reject";
  if (score >= 75) recommendation = "Shortlist for Next Round";
  else if (score >= 50) recommendation = "Consider with Caution";
  else recommendation = "Reject";

  return {
    matchScore: score,
    matchedSkills,
    missingSkills,
    summary: `Fallback analysis balances JD coverage and CV relevance. Precision: ${Math.round(precision*100)}%, Recall: ${Math.round(recall*100)}%, F1: ${Math.round(f1*100)}%.`,
    recommendation
  };
}