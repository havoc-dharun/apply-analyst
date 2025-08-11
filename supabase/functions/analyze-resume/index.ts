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
    
    // Do not pre-extract or inject keywords; let the model infer strictly from the JD
    const keywordsText = '';
    
         const prompt = `You are an intelligent HR assistant trained to evaluate job applications.

Compare the following candidate's resume with the given job description and provide a detailed analysis.

Resume:
${resumeText}

Job Description:
${jobDescription}

IMPORTANT: Base all matchedSkills and missingSkills strictly on the job description above; do not invent or use any external or generic keyword lists.

ANALYSIS INSTRUCTIONS:
1. Extract the relevant skills, technologies, and qualifications from the job description.
2. Extract the candidate's skills, technologies, and qualifications from the resume.
3. Identify which JD skills match the resume (matchedSkills) and which JD skills are not present in the resume (missingSkills). Return only JD-derived skills in both lists.
4. Calculate a realistic matchScore (0–100) driven by overlap between JD-required skills and resume evidence. Zero is valid.

ROLE CONTEXT ANALYSIS:
- If this is an HR/Marketing/Non-technical role, technical skills should not be considered matches unless explicitly required by the JD.
- If this is a technical role, HR/Marketing skills should not be considered matches unless explicitly required by the JD.

Return ONLY a valid JSON response in this exact format:
{
  "matchScore": [number 0..100],
  "matchedSkills": ["skill1", "skill2", "skill3"],
  "missingSkills": ["missing1", "missing2", "missing3"],
  "summary": "2-3 sentence objective summary of candidate fit",
  "recommendation": "Shortlist for Next Round" | "Consider with Caution" | "Reject"
}`

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

    // Trust the model but keep the structure and constraints; do not inject or filter by code-side keyword lists
    const normalizeStrArr = (arr: any, limit: number) => (Array.isArray(arr) ? arr : [])
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, limit);

    const analysisResult: GeminiAnalysisResult = {
      matchScore: Math.min(100, Math.max(0, result.matchScore)),
      matchedSkills: normalizeStrArr(result.matchedSkills, 5),
      missingSkills: normalizeStrArr(result.missingSkills, 3),
      summary: String(result.summary || ''),
      recommendation: result.recommendation,
    };

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in analyze-resume function:", error);
    return new Response(
      JSON.stringify({ error: 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});