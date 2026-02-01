import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productQuery, userId } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      tools: [{ googleSearch: {} }] 
    }, { apiVersion: 'v1beta' });

    // We ask for currency and deeper comparison logic here
    const prompt = `
      Perform a professional industrial audit on: "${productQuery}".
      
      CRITICAL INSTRUCTIONS:
      1. IMAGE: Find the direct URL of a high-res image of the product.
      2. CURRENCY: Detect user location (implicitly) and provide prices in local currency if possible, else USD.
      3. STAR RATING: Provide a 1-5 star rating for Durability, Repairability, and Value.
      4. COMPARISON: Find 2 equivalent products and provide their 5-star scores too.
      5. LINKS: Ensure links are to active major retailers (Amazon, eBay, Walmart).

      Return ONLY JSON:
      {
        "main_product": {
          "name": "...",
          "image": "URL",
          "stars": 4.5,
          "durability_explanation": "What the score actually means (e.g. 80/100 means the motor will last 5 years but the plastic clips may snap).",
          "vendors": [{"name": "...", "price": "...", "url": "..."}]
        },
        "comparisons": [
          {"name": "Equivalent Brand X", "stars": 4.0, "price": "...", "link": "...", "image": "...", "why": "Better for user if they want X."}
        ],
        "personal_match": "Based on user privacy habits, this is a [Match/No Match] because..."
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}