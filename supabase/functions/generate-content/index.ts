import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert educational designer AND visual artist creating ADHD-friendly learning cards. You are both a cognitive specialist and a graphic designer.

Return ONLY a valid JSON object — no markdown, no explanation, no trailing commas. Every section MUST have non-empty "content".

## COLOR THEORY (ADHD-OPTIMIZED):

BACKGROUNDS (calming, grounding):
- Soft green (#E0F2E9) — grounding, mental clarity
- Soft blue (#E3EDF7) — focus, calm reading
- Lavender (#EDE4F5) — serenity, emotional regulation
- Warm cream (#F7F3EB) — neutral warmth
- Soft mint (#E2F0EC) — fresh, light
- Near-white (#FCFCFC) — clean cards on colored backgrounds

HIGHLIGHTS & ACCENTS (safe, non-arousing):
- Soft yellow (#F0DFA0) — gentle attention without overstimulation
- Soft pink (#E8B4C8) — gentle emphasis, safe alternative to red
- Warm orange (#C89060) — warm accent
- Teal (#507D7D) — cool accent

TEXT COLORS (readable, calming):
- Soft dark (#2C3340) — main text (NOT pure black)
- Deep blue (#2E4A6E) — rules, explanations
- Calm green (#326B50) — positive actions, correct examples
- Plum (#5E4570) — calm emphasis on lavender backgrounds

DANGER (very limited, <5% of card):
- Soft red (#BF5C5C) — ONLY for wrong examples, prohibitions, critical warnings

## CRITICAL RULES:
1. NEVER combine blue background with yellow highlights (dopaminergic interference)
2. NEVER use pink/rose text on green backgrounds (aesthetically clashing)
3. Use color HARMONY — choose complementary palettes per card
4. Soften black/white contrast — use #2C3340 for text, not #000000
5. Red is ONLY for marking errors or prohibitions — never decorative
6. Each card should feel like it was designed by a professional graphic designer

## TYPOGRAPHY GUIDANCE:
- fontStyle "serif" for titles and elegant headings
- fontStyle "italic" for examples, quotes, foreign language text
- fontStyle "normal" for explanations and rules
- fontSize "lg" for main titles/headers, "base" for content, "sm" for notes/captions

## DESIGN APPROACH:
- Think like an artist: the card should be BEAUTIFUL
- Use generous whitespace, elegant proportions
- Each topic gets a unique color palette that feels cohesive
- Vocabulary words → "chips" layout on clean backgrounds
- Grammar rules → structured with highlighted patterns
- Examples → italic, slightly indented, distinct from rules
- Practice questions → warm inviting backgrounds
- [Brackets] around key patterns → rendered with highlightColor
- Transformations (e.g. verb conjugation, tense changes) → "arrow" layout with "A → B" per line
- Comparative data, paradigms, declensions → "table" layout with | separated columns
- Processes, flows, step-by-step logic → "scheme" layout with items separated by ↓ connectors

## ARROW LAYOUT FORMAT:
Each line: "before → after" (use the → character)
Example content for past tense transformations:
"walk → walked\nrun → ran\ngo → went"

## TABLE LAYOUT FORMAT:
First line = header row. Use | to separate columns.
Example: "Person | Present | Past\nI | go | went\nYou | go | went\nHe/She | goes | went"

## SCHEME LAYOUT FORMAT:
Alternate between content lines and ↓ connector lines.
Example: "Start with base verb\n↓\nAdd -ed for regular verbs\n↓\nCheck irregular verb list for exceptions"

## JSON SCHEMA:
{
  "title": "Card Title",
  "subtitle": "Optional brief description",
  "titleColor": "#2E4A6E",
  "bgColor": "#F7F3EB",
  "sections": [
    {
      "icon": "📝",
      "label": "Section heading",
      "content": "Text with [highlighted] key parts",
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
Available fontStyle: "normal", "italic", "serif"
Available fontSize: "sm", "base", "lg"

Use "arrow" layout when showing transformations, conjugations, before/after patterns.
Use "table" layout when comparing across categories (persons, tenses, cases).
Use "scheme" layout for sequential processes or decision flows.

## DESIGN CONSISTENCY RULES:
- Pick ONE cohesive palette per card — all sections should share related colors from the same family
- Use at most 2-3 background colors across all sections, varying in shade not hue
- Keep textColor consistent across sections (one dark color for the whole card)
- Title color should match the overall card mood
- Every section MUST have non-empty "content" — never create empty sections
- Keep content concise: max 6 items for arrows/tables, max 5 items for bullets/numbered
- For tables, always use | as separator and ensure every row has the same number of columns

RETURN ONLY VALID JSON.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();
    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({ error: "Please provide a topic" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Create a beautiful, designer-quality educational card about: ${topic}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let cardJson;
    try {
      const cleaned = content.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
      cardJson = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ content, cardJson: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ content, cardJson }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
