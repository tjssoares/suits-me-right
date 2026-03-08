import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { productQuery } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      // 2026 Standard: The /openai/ suffix is required for Chat Completion compatibility
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });

    const completion = await openai.chat.completions.create({
      // FIXED: Using the 2026 stable Flash model (1.5-flash is deprecated)
      model: "gemini-2.0-flash", 
      messages: [
        { 
          role: "system", 
          content: "You are a Senior Product Consultant. Return ONLY a JSON object matching the requested schema with main_product (name, public_summary, durability, stars, qualities, image, competitors, new_deals) and suits_me_reason." 
        },
        { role: "user", content: `Analyze this product for 2026: ${productQuery}` }
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    return NextResponse.json(JSON.parse(content || "{}"));
  } catch (error: any) {
    // This will now log more helpful details if it fails
    console.error("Gemini API Error Details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}