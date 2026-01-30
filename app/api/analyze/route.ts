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
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      tools: [{ googleSearch: {} }] 
    }, { apiVersion: 'v1beta' });

    const prompt = `
      Act as a Lead Product Engineer. Deeply analyze: "${productQuery}".
      
      TASKS:
      1. Find the official product image URL.
      2. Find 3 current vendors with prices and direct links.
      3. Rate durability 0-100 (0=Junk, 100=Heirloom).
      4. Suggest 1 "Ideal Alternative" that might be better based on longevity.

      Return ONLY JSON:
      {
        "summary": "3-sentence review",
        "score": 85,
        "score_label": "85/100 - Built to Last",
        "image_url": "Direct link to image",
        "pros": ["..."], "cons": ["..."],
        "vendors": [
          {"name": "Amazon", "price": "$XX", "url": "link"},
          {"name": "Best Buy", "price": "$XX", "url": "link"}
        ],
        "alternative": {
          "name": "Product Name",
          "reason": "Why it's better for the user",
          "image": "URL"
        }
      }
    `;

    const result = await model.generateContent(prompt);
    const analysis = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());

    // Save full report to metadata
    await supabase.from('search_history').upsert({
      product_name: productQuery.toLowerCase().trim(),
      analysis_summary: analysis.summary,
      durability_score: analysis.score,
      user_id: userId || null,
      metadata: analysis
    });

    return NextResponse.json(analysis);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}