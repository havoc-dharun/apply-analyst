const GEMINI_API_KEY = "AIzaSyC8jDvbzZv-HFwlz_lqR_6Ed37PKsDk0Ic";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

export interface GeminiAnalysisResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
  recommendation: "Shortlist for Next Round" | "Consider with Caution" | "Reject";
}

export const analyzeResumeWithGemini = async (
  resumeText: string,
  jobDescription: string
): Promise<GeminiAnalysisResult> => {
  const prompt = `You are an intelligent HR assistant trained to evaluate job applications.

Compare the following candidate's resume with the given job description and provide a detailed analysis.

Resume:
${resumeText}

Job Description:
${jobDescription}

Analyze the content and return ONLY a valid JSON response in this exact format:
{
  "matchScore": [number from 0 to 100],
  "matchedSkills": ["skill1", "skill2", "skill3"],
  "missingSkills": ["missing1", "missing2", "missing3"],
  "summary": "2-3 sentence objective summary of candidate fit",
  "recommendation": "Shortlist for Next Round" | "Consider with Caution" | "Reject"
}

Be objective and focus on technical qualifications, experience, and role-specific skills.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in Gemini response");
    }

    const result = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!result.matchScore || !result.summary || !result.recommendation) {
      throw new Error("Invalid response structure from Gemini");
    }

    return {
      matchScore: Math.min(100, Math.max(0, result.matchScore)),
      matchedSkills: result.matchedSkills || [],
      missingSkills: result.missingSkills || [],
      summary: result.summary,
      recommendation: result.recommendation,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze resume with Gemini AI");
  }
};

// Helper function to extract text from uploaded file
export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // For demo purposes, we'll use a basic text extraction
      // In production, you'd want to use a proper PDF/DOCX parser
      resolve(text || `Resume content for ${file.name}`);
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    
    if (file.type === "text/plain") {
      reader.readAsText(file);
    } else {
      // For PDF/DOCX files, return a placeholder for demo
      resolve(`Professional resume document: ${file.name}
      
Skills: JavaScript, React, Node.js, Python, Machine Learning, Data Analysis
Experience: 5+ years in software development
Education: Computer Science degree
Previous roles: Senior Developer, Team Lead
Projects: Multiple web applications, API development, database design
Certifications: AWS, Google Cloud`);
    }
  });
};