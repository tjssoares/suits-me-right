import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productQuery, userId, location } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);

    // FIX: Using the newer stable 'gemini-2.0-flash' or 'gemini-2.5-flash'
    // Grounding works best with these in 2026.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash", // Update to 2.0 or 2.5
      tools: [{ googleSearch: {} }] 
    });

    const prompt = `
      User Location: ${location || "United Kingdom"}
      Search: "${productQuery}"
      TASK: Perform a market audit. Find NEW and USED prices in £ (GBP).
      RETURN ONLY JSON:
      {
        "main_product": {
          "name": "...",
          "image": "...",
          "stars": 4.5,
          "new_deals": [{"vendor": "...", "price": "...", "url": "..."}],
          "used_deals": [{"vendor": "...", "price": "...", "url": "..."}]
        },
        "suits_me_reason": "Detailed durability/repairability audit."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Cleaning logic remains the same
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(cleanJson));

  } catch (error: any) {
    console.error("Gemini Error:", error.message);
    
    // If 2.0 fails, it might be a regional rollout issue. Try a more generic ID.
    return NextResponse.json({ 
      error: `Model error: ${error.message}. Try changing model to 'gemini-2.5-flash' or 'gemini-flash-latest' in route.ts.` 
    }, { status: 500 });
  }
}