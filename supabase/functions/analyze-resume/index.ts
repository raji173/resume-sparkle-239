import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the analysis record
    const { data: analysis, error: fetchError } = await supabase
      .from("resume_analyses")
      .select("*")
      .eq("id", analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error("Analysis not found");
    }

    // Download the resume file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("resumes")
      .download(analysis.file_url);

    if (downloadError || !fileData) {
      throw new Error("Failed to download resume file");
    }

    // Extract text from the file
    let resumeText = "";
    const fileName = analysis.file_name.toLowerCase();

    if (fileName.endsWith(".pdf")) {
      // For PDF, extract raw text content
      const arrayBuffer = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const textDecoder = new TextDecoder("utf-8", { fatal: false });
      const rawContent = textDecoder.decode(bytes);

      // Extract text between stream/endstream markers (PDF text extraction)
      const streamRegex = /stream\s*\n([\s\S]*?)endstream/g;
      let match;
      const textParts: string[] = [];
      while ((match = streamRegex.exec(rawContent)) !== null) {
        const streamContent = match[1];
        // Extract text from PDF text operators
        const textOpRegex = /\(([^)]*)\)\s*Tj|\[([^\]]*)\]\s*TJ/g;
        let textMatch;
        while ((textMatch = textOpRegex.exec(streamContent)) !== null) {
          if (textMatch[1]) {
            textParts.push(textMatch[1]);
          } else if (textMatch[2]) {
            const tjParts = textMatch[2].match(/\(([^)]*)\)/g);
            if (tjParts) {
              textParts.push(tjParts.map(p => p.slice(1, -1)).join(""));
            }
          }
        }
      }
      resumeText = textParts.join(" ").replace(/\\n/g, "\n").replace(/\s+/g, " ").trim();

      // Fallback: if no text extracted, use raw printable chars
      if (!resumeText) {
        resumeText = rawContent.replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 10000);
      }
    } else {
      // For DOCX, extract text from XML content
      resumeText = await fileData.text();
      // Remove XML tags to get plain text
      resumeText = resumeText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }

    // Limit text length
    resumeText = resumeText.slice(0, 8000);

    // Update with extracted text
    await supabase.from("resume_analyses").update({
      resume_text: resumeText,
      status: "processing",
    }).eq("id", analysisId);

    // Call Lovable AI for analysis
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an expert resume analyst and career coach. Analyze resumes against job descriptions and provide detailed, actionable feedback. Always respond with valid JSON matching the exact schema requested.`;

    const userPrompt = `Analyze this resume against the job description and return a JSON object with these exact fields:

Resume Text:
${resumeText}

Job Title: ${analysis.job_title || "Not specified"}
Job Description: ${analysis.job_description || "Not specified"}

Return ONLY valid JSON with these fields:
{
  "ats_score": (number 0-100, how well the resume would pass ATS systems),
  "keyword_match_percentage": (number 0-100, percentage of job keywords found in resume),
  "matched_keywords": (array of strings - keywords from job description found in resume),
  "missing_skills": (array of strings - important skills from job description NOT in resume),
  "skills_found": (array of strings - all skills identified in the resume),
  "experience_years": (number - estimated years of experience),
  "education": (array of strings - education entries found),
  "resume_summary": (string - 2-3 sentence professional summary of the candidate),
  "suggestions": (array of 5-7 strings - specific, actionable improvement suggestions),
  "weak_sections": (array of strings - sections that need improvement with explanation),
  "industry_suggestions": (array of strings - industry-specific tips for the target role)
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_analysis",
              description: "Submit the resume analysis results",
              parameters: {
                type: "object",
                properties: {
                  ats_score: { type: "number" },
                  keyword_match_percentage: { type: "number" },
                  matched_keywords: { type: "array", items: { type: "string" } },
                  missing_skills: { type: "array", items: { type: "string" } },
                  skills_found: { type: "array", items: { type: "string" } },
                  experience_years: { type: "number" },
                  education: { type: "array", items: { type: "string" } },
                  resume_summary: { type: "string" },
                  suggestions: { type: "array", items: { type: "string" } },
                  weak_sections: { type: "array", items: { type: "string" } },
                  industry_suggestions: { type: "array", items: { type: "string" } },
                },
                required: [
                  "ats_score", "keyword_match_percentage", "matched_keywords",
                  "missing_skills", "skills_found", "experience_years", "education",
                  "resume_summary", "suggestions", "weak_sections", "industry_suggestions",
                ],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        throw new Error("Rate limited. Please try again in a moment.");
      }
      if (aiResponse.status === 402) {
        throw new Error("AI credits exhausted. Please add funds.");
      }
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    let result;

    // Extract from tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse content as JSON
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    // Update the analysis record with results
    await supabase.from("resume_analyses").update({
      ats_score: result.ats_score,
      keyword_match_percentage: result.keyword_match_percentage,
      matched_keywords: result.matched_keywords,
      missing_skills: result.missing_skills,
      skills_found: result.skills_found,
      experience_years: result.experience_years,
      education: result.education,
      resume_summary: result.resume_summary,
      suggestions: result.suggestions,
      weak_sections: result.weak_sections,
      industry_suggestions: result.industry_suggestions,
      status: "completed",
    }).eq("id", analysisId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-resume error:", error);

    // Try to mark analysis as failed
    try {
      const { analysisId } = await req.clone().json();
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("resume_analyses").update({ status: "failed" }).eq("id", analysisId);
    } catch {}

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
