import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productQuery, userId, location } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing in Vercel" }, { status: 500 });
    }

    // Initialize the API without the 'v1beta' string in the constructor
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Fix: Remove the 'models/' prefix and ensure tool usage is correct
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      tools: [{ googleSearch: {} }] 
    });

    const prompt = `
      Market audit for: "${productQuery}" in ${location || "United Kingdom"}.
      
      RULES:
      1. Provide prices in local currency (£ for UK, $ for US).
      2. Provide New and Used links.
      3. Return ONLY a JSON object.

      Structure:
      {
        "main_product": {
          "name": "Full Name",
          "image": "Direct JPG/PNG URL",
          "stars": 4.5,
          "new_deals": [{"vendor": "Name", "price": "£X", "url": "URL"}],
          "used_deals": [{"vendor": "Name", "price": "£X", "url": "URL"}]
        },
        "suits_me_reason": "Detailed durability and repairability explanation."
      }
    `;

    // Standard generateContent call
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean markdown and parse
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);
    
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ 
      error: "Model connection failed. Please ensure Search Grounding is enabled in your Google AI Studio console." 
    }, { status: 500 });
  }
}