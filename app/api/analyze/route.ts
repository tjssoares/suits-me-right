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
      Perform a professional market audit for: "${productQuery}" in ${location || "United Kingdom"}.
      
      CRITICAL INSTRUCTIONS:
      1. IMAGES: Find a direct, high-quality URL of the product image.
      2. NEW DEALS: Search Amazon.co.uk, Argos, and Currys. Provide EXACT direct product page URLs and current prices.
      3. USED DEALS: Search eBay.co.uk and Back Market for refurbished/used prices and direct listing URLs.
      4. QUALITIES: List 3-4 key technical features or pros of this specific product.
      5. COMPETITORS: Find 2 similar products currently on the market and their typical UK price points.
      
      RESPONSE FORMAT: You must respond ONLY with a valid JSON object. No intro text, no markdown code blocks.
      
      JSON STRUCTURE:
      {
        "main_product": {
          "name": "Full Official Product Name",
          "image": "DIRECT_IMAGE_URL",
          "stars": 4.5,
          "qualities": ["Feature 1", "Feature 2", "Feature 3"],
          "new_deals": [{"vendor": "Retailer Name", "price": "£XX.XX", "url": "DIRECT_PRODUCT_URL"}],
          "used_deals": [{"vendor": "eBay/BackMarket", "price": "£XX.XX", "url": "DIRECT_LISTING_URL"}],
          "competitors": [{"name": "Competitor Model", "price": "£XX.XX"}]
        },
        "suits_me_reason": "Provide a deep 3-paragraph analysis. Paragraph 1: Value for money vs competitors. Paragraph 2: Build quality and longevity. Paragraph 3: Market trend (is now a good time to buy?)."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Cleaning logic to extract JSON even if the AI adds text around it
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI failed to generate a valid data block.");

    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error: any) {
    console.error("Gemini Error:", error.message);
    return NextResponse.json({ error: `Audit failed: ${error.message}` }, { status: 500 });
  }
}