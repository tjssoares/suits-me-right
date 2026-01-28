import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Force dynamic ensures Vercel doesn't try to "pre-build" this during deployment
export const dynamic = 'force-dynamic';

// Initialize Supabase
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

    // --- STEP 2: CALL AI (The 2026 Optimized Way) ---
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    // We use v1beta to access the new 'googleSearch' tool
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash", 
      tools: [{ googleSearch: {} }] // Updated from googleSearchRetrieval
    }, { apiVersion: 'v1beta' });

    const prompt = `
      Perform a search for real customer reviews and durability teardowns for: "${productQuery}".
      Synthesize the findings into:
      1. A 3-sentence summary of build quality and failure points.
      2. A "Durability Score" from 1-100.
      Return ONLY a JSON object: {"summary": "...", "score": 85}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up response if AI includes markdown code blocks
    const