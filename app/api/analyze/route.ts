import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { productQuery } = await req.json();

    // This setup allows your Gemini Key to work with the OpenAI library
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, 
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });

    const completion = await openai.chat.completions.create({
      model: "gemini-1.5-flash", // Gemini's fast, reliable model
      messages: [
        {
          role: "system",
          content: `You are a Senior Product Consultant and Durability Auditor. Your job is to prevent users from making bad purchases by analyzing their intent.

          STRICT RULES:
          1. DURABILITY SCORE: Calculate a score based on:
             - 0-40: Fragile or "End of Life" (No more updates).
             - 41-70: Average consumer tech.
             - 71-90: High-quality, repairable.
             - 91-100: "Buy it for Life" quality.
          
          2. USER INTENT: Identify WHY the user wants this model.
          3. STRATEGIC ALTERNATIVES: Suggest a Value, Performance, and Modern alternative.

          RETURN JSON ONLY:
          {
            "main_product": {
              "name": "Full Product Name",
              "public_summary": "Current standing in 2026.",
              "durability": 0, 
              "stars": 0.0,
              "qualities": ["Highlight 1", "Highlight 2"],
              "image": "",
              "competitors": [
                {
                  "name": "Alternative Name",
                  "price": "Price Range",
                  "stars": 4.5,
                  "highlights": ["Advantage 1", "Advantage 2"],
                  "url": "#",
                  "image": ""
                }
              ]
            },
            "suits_me_reason": "Deep-dive analysis text."
          }`
        },
        {
          role: "user",
          content: `Analyze this product query: ${productQuery}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}