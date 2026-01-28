import { GoogleGenerativeAI, DynamicRetrievalMode } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (for the "Caching" logic we discussed)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for backend writes
);

export async function POST(req: Request) {
  try {
    const { productQuery, userId } = await req.json();

    if (!productQuery) {
      return NextResponse.json({ error: "No product query provided" }, { status: 400 });
    }

    // --- STEP 1: CHECK CACHE (Save Quota!) ---
    const { data: existingSearch } = await supabase
      .from('search_history')
      .select('*')
      .eq('product_name', productQuery.toLowerCase().trim())
      .single();

    if (existingSearch) {
      console.log("Found in cache! Using existing data.");
      return NextResponse.json({
        summary: existingSearch.analysis_summary,
        score: existingSearch.durability_score,
        cached: true
      });
    }

    // --- STEP 2: CALL AI (If not in cache) ---
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    // Using 1.5-flash: It has a much more stable free quota than 2.0 right now.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      // This is the "Brain" - it lets Gemini use Google Search
      tools: [{ googleSearchRetrieval: {} }] 
    });

    const prompt = `
      You are a product durability expert. Search for real customer reviews and teardowns for: "${productQuery}".
      Provide:
      1. A 3-sentence summary of the build quality and common failure points.
      2. A "Durability Score" from 1-100 based on long-term reliability.
      Return ONLY a JSON object like this: {"summary": "...", "score": 85}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up the response (AI sometimes adds markdown blocks)
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(cleanedJson);

    // --- STEP 3: SAVE TO DB (For the next user) ---
    await supabase.from('search_history').insert({
      user_id: userId || null, // Works for guests too
      product_name: productQuery.toLowerCase().trim(),
      analysis_summary: analysis.summary,
      durability_score: analysis.score
    });

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("Analyze API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}