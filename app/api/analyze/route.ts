import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { productQuery, userId } = await req.json();

    // Initialize OpenAI inside the POST function to avoid build-time credential errors
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Senior Product Consultant and Durability Auditor. Your job is to prevent users from making bad purchases by analyzing their intent.

          STRICT RULES:
          1. DURABILITY SCORE: Do NOT default to 85. Calculate a score based on:
             - 0-40: Fragile, poor battery, or "End of Life" (No more software updates).
             - 41-70: Average consumer tech, decent but has a shelf life.
             - 71-90: High-quality build, repairable, good manufacturer support.
             - 91-100: "Buy it for Life" quality (Cast iron, enterprise-grade gear).
          
          2. USER INTENT ANALYSIS: 
             Identify WHY the user is looking at this specific model. 
             If it's an older model (like Surface Pro 4), are they after the price, the form factor, or a specific feature?
          
          3. STRATEGIC ALTERNATIVES:
             Suggest rivals that "Bridge the Gap." If the searched product is old, suggest the oldest model of that line that STILL supports modern OS (e.g., Surface Pro 6 for Win 11). 
             Suggest one "Value" alternative, one "Performance" alternative, and one "Modern" alternative.

          RETURN JSON ONLY:
          {
            "main_product": {
              "name": "Full Product Name",
              "public_summary": "Identify the product's 'Current Standing' in 2026. Mention software support/support status.",
              "durability": 0, 
              "stars": 0.0,
              "qualities": ["Highlight 1", "Highlight 2"],
              "image": "Search for a valid image URL or leave empty",
              "competitors": [
                {
                  "name": "Alternative Name",
                  "price": "Price Range",
                  "stars": 4.5,
                  "highlights": ["Why this solves the 'Legacy Problem'", "Key advantage"],
                  "url": "Search URL",
                  "image": ""
                }
              ]
            },
            "suits_me_reason": "Provide a deep-dive analysis. 'You are likely looking at the [Product] because of its [Estimated Intent]. However, you should be aware of [Critical Issue]. We suggest [Strategic Alternative] because it offers [Benefit] while remaining budget-friendly.'"
          }`
        },
        {
          role: "user",
          content: `Analyze this product query and provide strategic alternatives based on 2026 standards: ${productQuery}`
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