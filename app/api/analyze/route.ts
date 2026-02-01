import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productQuery, userId } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Using Flash for better grounding speed
      tools: [{ googleSearch: {} }] 
    }, { apiVersion: 'v1beta' });

    const prompt = `
      Perform a deep audit for a UK-based user: "${productQuery}".
      
      CONSTRAINTS:
      1. CURRENCY: All prices MUST be in GBP (£).
      2. SUPPLIERS: Prioritize UK retailers (Amazon.co.uk, Argos, Currys, John Lewis).
      3. IMAGES: You MUST provide a direct, public JPG/PNG URL for every product. Do not use placeholder URLs.
      4. COMPARISON: Compare the main product against 2 key rivals.

      Return ONLY JSON:
      {
        "main_product": {
          "name": "...",
          "image": "URL",
          "stars": 4.5,
          "description": "...",
          "specs": ["Battery: 10hrs", "Weight: 1.2kg"],
          "vendors": [{"name": "...", "price": "£...", "url": "..."}]
        },
        "equivalents": [
          {"name": "...", "stars": 4.2, "image": "...", "price": "£...", "specs": ["..."], "why_better": "..."}
        ],
        "suits_me_reason": "Because you value longevity and this has a 5-year warranty."
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}