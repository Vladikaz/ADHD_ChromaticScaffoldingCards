import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert educational designer AND visual artist creating ADHD-friendly learning cards. You are both a cognitive specialist and a graphic designer.

Return ONLY a valid JSON object — no markdown, no explanation, no trailing commas. Every section MUST have non-empty "content".

## COLOR THEORY (ADHD-OPTIMIZED):
- BACKGROUNDS: Soft green (#E0F2E9), Soft blue (#E3EDF7), Lavender (#EDE4F5), Warm cream (#F7F3EB)
- HIGHLIGHTS: Soft yellow (#F0DFA0), Soft pink (#E8B4C8)
- TEXT: Soft dark (#2C3340), Deep blue (#2E4A6E)
- DANGER: Soft red (#BF5C5C) (ONLY for errors)

## DESIGN APPROACH:
- [Brackets] around key patterns -> highlightColor
- Transformations -> "arrow" layout (A -> B)
- Comparative data -> "table" layout (| separator)
- Sequential steps -> "scheme" layout (↓ connector)

## JSON SCHEMA:
{
  "title": "Card Title",
  "subtitle": "Description",
  "titleColor": "#2E4A6E",
  "bgColor": "#F7F3EB",
  "sections": [
    {
      "icon": "📝",
      "label": "Heading",
      "content": "Text with [highlights]",
      "bgColor": "#E3EDF7",
      "textColor": "#2C3340",
      "highlightColor": "#F0DFA0",
      "layout": "paragraph",
      "fontStyle": "normal",
      "fontSize": "base"
    }
  ]
}

Available layouts: "paragraph", "chips", "numbered", "bullets", "example", "table", "arrow", "scheme"
RETURN ONLY VALID JSON.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), { status: 400, headers: corsHeaders });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${SYSTEM_PROMPT}\n\nTask: Create an ADHD-friendly educational card about: ${topic}` }]
        }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Безопасная очистка JSON без использования проблемных регулярных выражений
    let cleanedJson = rawContent.trim();
    if (cleanedJson.includes("```")) {
      const parts = cleanedJson.split("```");
      // Ищем часть, которая похожа на JSON
      cleanedJson = parts.find(p => p.includes("{") && p.includes("}")) || cleanedJson;
      if (cleanedJson.startsWith("json")) {
        cleanedJson = cleanedJson.substring(4);
      }
    }
    cleanedJson = cleanedJson.trim();

    const cardJson = JSON.parse(cleanedJson);

    return new Response(JSON.stringify({ content: rawContent, cardJson }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Edge Function Error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
