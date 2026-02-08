// File Location: app/api/analyze/route.ts

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
      1. PUBLIC SUMMARY: Provide a 250-word objective summary of the product based on manufacturer specs and top tech reviews.
      2. MAIN IMAGE: Find a direct, high-quality URL for the main product image.
      3. VENDOR LINKS: Find EXACT product page links and prices at Amazon.co.uk, Argos.co.uk, and Currys.
      4. USED DEALS: Find search results for eBay.co.uk and BackMarket.
      5. COMPETITORS: Find 2 rival products. For each, provide: Name, Price, a direct IMAGE URL, a Star Rating (1-5), and 3 short topics on why they are competitors.
      6. SUITS ME REASON: Write 3 paragraphs for a registered user analyzing value, longevity (durability), and personalized fit.
      
      CRITICAL: You must respond ONLY with a valid JSON object. Use \\n for newlines.
      
      JSON STRUCTURE:
      {
        "main_product": {
          "name": "Full Product Name",
          "image": "DIRECT_IMAGE_URL",
          "public_summary": "250-word summary...",
          "stars": 4.8,
          "durability": 85,
          "qualities": ["Feature 1", "Feature 2"],
          "new_deals": [{"vendor": "Amazon", "price": "£XX.XX", "url": "DIRECT_URL"}],
          "used_deals": [{"vendor": "eBay", "price": "£XX.XX", "url": "DIRECT_URL"}],
          "competitors": [
            {
              "name": "Competitor Name", 
              "price": "£XX.XX", 
              "image": "URL", 
              "stars": 4.5, 
              "highlights": ["Point 1", "Point 2", "Point 3"],
              "url": "DIRECT_URL"
            }
          ]
        },
        "suits_me_reason": "3-paragraph analysis for premium users."
      }
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // CLEANING: This fixes the "Bad control character" error by stripping hidden line breaks
    const cleanJsonString = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") 
      .trim();

    const jsonMatch = cleanJsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI failed to generate a valid data block.");

    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error: any) {
    console.error("Gemini Error:", error.message);
    return NextResponse.json({ error: `Audit failed: ${error.message}` }, { status: 500 });
  }
}