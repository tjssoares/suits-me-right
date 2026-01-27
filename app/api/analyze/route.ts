import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request) {
  // 1. Initialize EVERYTHING inside the function to protect the build
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // 2. Parse the request body (Note: 'request' is the correct variable name)
    const { productQuery, userId } = await request.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    const prompt = `
      Analyze the durability and long-term value of: ${productQuery}. 
      Synthesize 1,000+ customer reviews. 
      Provide a 250-word synthesis including:
      1. Key failure points.
      2. Expected lifespan.
      3. A durability score out of 100.
      Return the response in JSON format: { "summary": "text", "score": number }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON parsing: sometimes AI returns markdown backticks, let's strip them
    const cleanedText = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanedText);

    // 3. Save to history if user is logged in
    if (userId) {
      const { error } = await supabase.from('search_history').insert({
        user_id: userId,
        product_name: productQuery,
        analysis_summary: data.summary,
        durability_score: data.score
      });
      
      if (error) console.error("Supabase storage error:", error);
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Analyze API Error:", error);
    return NextResponse.json({ error: "Failed to process analysis" }, { status: 500 });
  }
}