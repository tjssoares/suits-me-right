import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productQuery, userId, location } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We stick with gemini-2.0-flash as it's the most stable for search right now
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} }],
      // FORCE JSON mode at the configuration level
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      Perform a market audit for: "${productQuery}" in ${location || "United Kingdom"}.
      You MUST return a JSON object with this EXACT structure:
      {
        "main_product": {
          "name": "string",
          "image": "string",
          "stars": number,
          "new_deals": [{"vendor": "string", "price": "string", "url": "string"}],
          "used_deals": [{"vendor": "string", "price": "string", "url": "string"}]
        },
        "suits_me_reason": "string"
      }
      Do not include any text before or after the JSON.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // IMPROVED CLEANING: Use Regex to find the FIRST { and the LAST }
    // This ignores any grounding text Google adds at the end.
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("No JSON found in response:", responseText);
      throw new Error("AI did not return valid JSON format.");
    }

    const cleanJson = jsonMatch[0];
    const parsedData = JSON.parse(cleanJson);
    
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Gemini Error:", error.message);
    return NextResponse.json({ 
      error: `Audit failed: ${error.message}. Please try again.` 
    }, { status: 500 });
  }
}
