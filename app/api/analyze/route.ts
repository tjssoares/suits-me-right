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
      // THE FIX: The exact 2026 endpoint for Gemini OpenAI compatibility
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });

    const completion = await openai.chat.completions.create({
      model: "gemini-1.5-flash",
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
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}