import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productQuery, userId, location } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} }] 
    });

    const prompt = `
      Perform a deep market audit for: "${productQuery}" in ${location || "United Kingdom"}.
      
      1. Use Google Search to find LIVE prices for NEW items from: Amazon.co.uk, Argos, and Currys.
      2. Use Google Search to find LIVE prices for USED/REFURBISHED items from: eBay.co.uk and BackMarket.
      
      CRITICAL: Respond ONLY with a JSON object. Do not include markdown code blocks (like \`\`\`json).
      
      STRUCTURE:
      {
        "main_product": {
          "name": "Full official product name",
          "image": "Direct image URL if found, else empty string",
          "stars": 4.5,
          "new_deals": [{"vendor": "Retailer Name", "price": "£ price", "url": "URL"}],
          "used_deals": [{"vendor": "Retailer Name", "price": "£ price", "url": "URL"}]
        },
        "suits_me_reason": "A detailed 3-paragraph analysis of whether this is a good buy. Mention price trends and value for money specifically for a user in ${location}."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean logic to handle grounding text leakage
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI failed to generate data.");

    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error: any) {
    console.error("Gemini Error:", error.message);
    return NextResponse.json({ error: `Audit failed: ${error.message}` }, { status: 500 });
  }
}