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
      
      INSTRUCTIONS:
      1. Use Google Search to find the EXACT product page links (not homepages) and current prices at Amazon.co.uk, Argos.co.uk, and Currys.
      2. Find the EXACT search result or listing link for USED/REFURBISHED versions on eBay.co.uk and BackMarket.
      3. Find a direct, high-quality IMAGE URL for this specific product.
      
      CRITICAL: You must respond ONLY with a valid JSON object. No markdown, no intro.
      
      JSON STRUCTURE:
      {
        "main_product": {
          "name": "Full Product Name",
          "image": "DIRECT_IMAGE_URL",
          "stars": 4.8,
          "new_deals": [{"vendor": "Amazon", "price": "£XX.XX", "url": "DIRECT_URL"}],
          "used_deals": [{"vendor": "eBay", "price": "£XX.XX", "url": "DIRECT_URL"}]
        },
        "suits_me_reason": "Provide 3 detailed paragraphs analyzing value for money, price trends, and local availability."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Cleaning logic to ensure only JSON is parsed
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI failed to generate a valid data block.");

    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error: any) {
    console.error("Gemini Error:", error.message);
    return NextResponse.json({ error: `Audit failed: ${error.message}` }, { status: 500 });
  }
}