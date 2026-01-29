import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { productQuery, userId } = await req.json();

    if (!productQuery) {
      return NextResponse.json({ error: "No product query provided" }, { status: 400 });
    }

    // 1. Check Cache (Optional: comment this out if you want fresh results every time during testing)
    const { data: existingSearch } = await supabase
      .from('search_history')
      .select('*')
      .eq('product_name', productQuery.toLowerCase().trim())
      .single();

    if (existingSearch && existingSearch.metadata) {
      return NextResponse.json(existingSearch.metadata);
    }

    // 2. Call Gemini (Premium Research Mode)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      tools: [{ googleSearch: {} }] 
    }, { apiVersion: 'v1beta' });

    const prompt = `
      Act as a Lead Product Engineer. Perform a deep-dive durability audit for: "${productQuery}".
      
      Research Tasks:
      1. Search for long-term reliability reports and teardowns.
      2. Compare build materials and longevity against 2 direct market competitors.
      3. Identify specific weak points (e.g., specific capacitors, hinges, or software bloat).

      Return ONLY a JSON object with this structure:
      {
        "summary": "3-sentence professional overview.",
        "score": 85,
        "pros": ["strength 1", "strength 2"],
        "cons": ["weakness 1", "weakness 2"],
        "common_failures": ["Specific component failure 1", "Failure 2"],
        "market_position": "How it ranks vs competitors (e.g., 'Best in class for hinges, but worse battery than Brand X').",
        "expected_lifespan": "e.g., 4-6 years with heavy use",
        "repairability": "Easy/Moderate/Difficult"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(cleanedJson);

    // 3. Save to DB (Using a 'metadata' column to hold the full premium report)
    await supabase.from('search_history').upsert({
      product_name: productQuery.toLowerCase().trim(),
      analysis_summary: analysis.summary,
      durability_score: analysis.score,
      user_id: userId || null, // Works for guest/non-registered
      metadata: analysis // This stores the full JSON report
    });

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}