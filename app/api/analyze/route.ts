import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { productQuery } = await req.json();

    // FAIL-SAFE: Check if key exists before trying to use it
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error("CRITICAL ERROR: OPENAI_API_KEY is not set in Vercel Environment Variables.");
      return NextResponse.json({ error: "API Key missing in server environment." }, { status: 500 });
    }

    // Initialize OpenAI with Gemini's address
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });

    const completion = await openai.chat.completions.create({
      model: "gemini-1.5-flash", // Best free-tier model for this
      messages: [
        {
          role: "system",
          content: `You are a Senior Product Consultant. RETURN JSON ONLY:
          {
            "main_product": {
              "name": "Product Name",
              "public_summary": "Summary of status in 2026",
              "durability": 80,
              "stars": 4.5,
              "qualities": ["Quality 1"],
              "image": "",
              "competitors": []
            },
            "suits_me_reason": "Analysis text"
          }`
        },
        {
          role: "user",
          content: `Analyze: ${productQuery}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}