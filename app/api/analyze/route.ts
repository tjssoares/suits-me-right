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
      Deep Audit: "${productQuery}" in ${location || "United Kingdom"}.
      
      REQUIRED SECTIONS:
      1. PUBLIC SUMMARY: A 250-word objective summary. Source data from official manufacturer specs, top retailer reviews (Amazon/Argos), and expert YouTube consensus. Focus on performance, build quality, and "who it is for." 
      2. LINKS: Find DIRECT product page URLs for Amazon.co.uk, Argos, and Currys. Do NOT provide search result pages or homepages.
      3. IMAGE: Find a direct image URL (ending in .jpg, .png, or .webp) from a reputable source.
      4. USED DEALS: Search eBay and BackMarket for specific listing price ranges.
      5. COMPARISON: Compare against 2 main market rivals.
      6. PREMIUM REASONING: (Only for registered users) Personal value analysis.

      CRITICAL FORMATTING:
      - Return ONLY valid JSON.
      - Use \\n for all newlines. Do NOT use actual line breaks in the string.
      - If a link or image is not found, return an empty string "".

      JSON STRUCTURE:
      {
        "main_product": {
          "name": "Full Name",
          "image": "DIRECT_IMAGE_URL",
          "public_summary": "250-word text here...",
          "qualities": ["Feature 1", "Feature 2"],
          "new_deals": [{"vendor": "Name", "price": "£X", "url": "DIRECT_URL"}],
          "used_deals": [{"vendor": "Name", "price": "£X", "url": "URL"}],
          "competitors": [{"name": "Rival", "price": "£X"}]
        },
        "suits_me_reason": "Premium text here..."
      }
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // CLEANING LOGIC: Remove potential markdown wrappers and bad control characters
    const cleanJsonString = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Removes hidden control characters
      .trim();

    const jsonMatch = cleanJsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI output was not valid JSON.");

    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error: any) {
    console.error("Gemini Error:", error.message);
    return NextResponse.json({ error: `Audit failed: ${error.message}` }, { status: 500 });
  }
}