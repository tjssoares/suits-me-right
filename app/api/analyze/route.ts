import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productQuery, userId, location } = await req.json();
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      tools: [{ googleSearch: {} }] 
    }, { apiVersion: 'v1beta' });

    const prompt = `
      User Location: ${location || "Unknown"}
      Product: "${productQuery}"
      
      INSTRUCTIONS:
      1. If location is "Unknown", prompt for country in the "summary".
      2. Find NEW products from local/nationwide suppliers in the local currency.
      3. Find USED/REFURBISHED prices from eBay, BackMarket, or local marketplaces.
      4. Provide 5-star ratings for Durability, Repairability, and Value.
      5. "Suits Me Right" logic: Analyze if this matches a user who values sustainability.

      Return ONLY JSON:
      {
        "location_status": "${location ? 'detected' : 'ask'}",
        "currency_symbol": "£", 
        "main_product": {
          "name": "...",
          "image": "Direct JPG URL",
          "stars": 4.5,
          "new_deals": [{"vendor": "...", "price": "...", "url": "..."}],
          "used_deals": [{"vendor": "...", "price": "...", "url": "..."}]
        },
        "equivalents": [
          {"name": "...", "price": "...", "stars": 4, "image": "...", "diff": "Better battery but harder to repair"}
        ],
        "suits_me_reason": "..."
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}