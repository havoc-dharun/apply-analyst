import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface JDResult {
  title: string;
  description: string;
  skills: string[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roleTitle, companyName = 'Your Company', recruiterName } = await req.json();

    if (!roleTitle || typeof roleTitle !== 'string') {
      return new Response(JSON.stringify({ error: 'roleTitle is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const systemPrompt = `You are an expert HR recruiter. Generate a polished, inclusive Job Description for the given role. Return ONLY JSON following this schema:
{
  "title": string, // normalized, human-friendly title
  "description": string, // full Markdown JD with sections (Summary, Responsibilities, Skills, Benefits)
  "skills": string[] // 8-15 concise skill keywords
}
Use the company name when provided: ${companyName}. Keep it professional and specific to the role.`;

    const userPrompt = `Role title: ${roleTitle}\nCompany: ${companyName}\nRequested by: ${recruiterName ?? 'Recruiter'}\nReturn JSON only.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'user', parts: [{ text: userPrompt }] },
        ],
        generationConfig: {
          temperature: 0.6,
        },
      }),
    });

    if (!geminiRes.ok) {
      const text = await geminiRes.text();
      throw new Error(`Gemini API error: ${geminiRes.status} ${text}`);
    }

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed: JDResult | null = null;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch (_) {
      // ignore parse error and fall back
    }

    const fallback: JDResult = {
      title: roleTitle,
      description: `## ${roleTitle}\n\n**Company:** ${companyName}\n**Employment Type:** Full-Time\n**Location:** Remote/Hybrid\n\n### Job Summary\nWe are hiring a ${roleTitle} to join our team at ${companyName}.\n\n### Key Responsibilities\n• Drive impact in the role\n• Collaborate cross-functionally\n• Uphold high quality standards\n\n### Required Skills & Qualifications\n• Communication\n• Problem solving\n• Team collaboration\n\n### What We Offer\n• Competitive compensation\n• Growth and learning opportunities\n\n*Equal Opportunity Employer*`,
      skills: [
        'Communication',
        'Teamwork',
        'Problem Solving',
        'Project Management',
      ],
    };

    const result: JDResult = parsed && parsed.description ? parsed : fallback;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('generate-jd error:', error?.message || error);
    return new Response(JSON.stringify({ error: error?.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
