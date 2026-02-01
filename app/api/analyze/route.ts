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
      Product: "${productQuery}"
      User Country: ${location || "United Kingdom"}

      AUDIT REQUIREMENTS:
      1. PRICE: Must be in local currency of ${location || "UK"}.
      2. DEALS: Provide separate lists for NEW and USED/REFURBISHED.
      3. IMAGE: High-quality direct link.
      4. STARS: 1-5 rating.

      Return ONLY JSON:
      {
        "main_product": {
          "name": "...",
          "image": "...",
          "stars": 4.5,
          "new_deals": [{"vendor": "...", "price": "...", "url": "..."}],
          "used_deals": [{"vendor": "...", "price": "...", "url": "..."}]
        },
        "equivalents": [
          {"name": "...", "image": "...", "stars": 4, "price": "...", "diff": "..."}
        ],
        "suits_me_reason": "Detailed sustainability and durability breakdown."
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Safety check to extract JSON even if AI adds extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI failed to generate valid data.");
    
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to audit product." }, { status: 500 });
  }
}