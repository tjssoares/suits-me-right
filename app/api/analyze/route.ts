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

    // 1. Check Cache
    const { data: existingSearch } = await supabase
      .from('search_history')
      .select('*')
      .eq('product_name', productQuery.toLowerCase().trim())
      .single();

    if (existingSearch) {
      return NextResponse.json({
        summary: existingSearch.analysis_summary,
        score: existingSearch.durability_score,
        cached: true
      });
    }

    // 2. Call Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: "model: "gemini-3-flash-preview", 
      tools: [{ googleSearch: {} }] 
    }, { apiVersion: 'v1beta' });

    const prompt = `Search for durability reviews of: "${productQuery}". Return ONLY JSON: {"summary": "...", "score": 85}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(cleanedJson);

    // 3. Save to DB
    await supabase.from('search_history').insert({
      user_id: userId || null,
      product_name: productQuery.toLowerCase().trim(),
      analysis_summary: analysis.summary,
      durability_score: analysis.score
    });

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} // <--- Ensure this last bracket is included!