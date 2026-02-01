import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productQuery, userId, location } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // REMOVED: responseMimeType: "application/json"
    // This allows the Search tool to function without the 400 Bad Request error.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} }] 
    });

    const prompt = `
      Search for: "${productQuery}" in ${location || "United Kingdom"}.
      Find current NEW prices from retailers like Argos/Amazon/Currys and USED prices from eBay/BackMarket.
      
      CRITICAL: You must respond ONLY with a valid JSON object. 
      Do not include "I found this" or any introductory text.
      
      JSON STRUCTURE:
      {
        "main_product": {
          "name": "string",
          "image": "string",
          "stars": 4.5,
          "new_deals": [{"vendor": "string", "price": "string", "url": "string"}],
          "used_deals": [{"vendor": "string", "price": "string", "url": "string"}]
        },
        "suits_me_reason": "Provide a high-quality summary of why this product is a good or bad buy based on current UK market trends."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    /**
     * CLEANING LOGIC:
     * Since we can't use 'Controlled Generation', the model might add 
     * Markdown backticks (```json) or Search Citations at the end.
     * This regex extracts ONLY the JSON block.
     */
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("AI failed to generate a valid JSON data block.");
    }

    const cleanJson = jsonMatch[0];
    const parsedData = JSON.parse(cleanJson);
    
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Gemini API Error:", error.message);
    return NextResponse.json({ 
      error: `Audit failed: ${error.message}. Try refreshing or using a simpler product name.` 
    }, { status: 500 });
  }
}