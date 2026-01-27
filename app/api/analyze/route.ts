export const dynamic = 'force-dynamic';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const { productQuery, userId } = await req.json();

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
  const data = JSON.parse(response.text());

  // Save to history if user is logged in
  if (userId) {
    await supabase.from('search_history').insert({
      user_id: userId,
      product_name: productQuery,
      analysis_summary: data.summary,
      durability_score: data.score
    });
  }

  return NextResponse.json(data);
}
