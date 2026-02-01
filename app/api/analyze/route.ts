import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productQuery, userId, location } = await req.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key is missing from Vercel Environment Variables." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-1.5-flash which is most stable for search
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      tools: [{ googleSearch: {} }] 
    }, { apiVersion: 'v1beta' });

    const prompt = `
      Perform a market audit for: "${productQuery}" in ${location || "United Kingdom"}.
      
      RULES:
      1. Prices in local currency (£ for UK, $ for US, etc).
      2. Provide New and Used links.
      3. Return ONLY a JSON object.

      Structure:
      {
        "main_product": {
          "name": "Full Name",
          "image": "URL",
          "stars": 4.5,
          "new_deals": [{"vendor": "Name", "price": "£X", "url": "URL"}],
          "used_deals": [{"vendor": "Name", "price": "£X", "url": "URL"}]
        },
        "suits_me_reason": "Explanation"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean the response: remove markdown backticks if AI adds them
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    
    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json(parsedData);
    } catch (parseError) {
      console.error("JSON Parse Error:", responseText);
      return NextResponse.json({ error: "AI returned invalid data format. Try again." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}