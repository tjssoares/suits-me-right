import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { productQuery } = await req.json();

    // 1. Verify API Key exists in Vercel
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Vercel Error: OPENAI_API_KEY environment variable is missing.");
      return NextResponse.json({ error: "API configuration missing on server." }, { status: 500 });
    }

    // 2. The "Magic" Configuration for Gemini Free Tier
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });

    // 3. Request analysis using Gemini 1.5 Flash
    const completion = await openai.chat.completions.create({
      model: "gemini-1.5-flash", 
      messages: [
        {
          role: "system",
          content: `You are a Senior Product Consultant. 
          Return ONLY a JSON object with this structure:
          {
            "main_product": {
              "name": "string",
              "public_summary": "string",
              "durability": number,
              "stars": number,
              "qualities": ["string"],
              "image": "string",
              "competitors": []
            },
            "suits_me_reason": "string"
          }`
        },
        {
          role: "user",
          content: `Analyze the following product for durability and value in 2026: ${productQuery}`
        }
      ],
      // We use 'json_object' to ensure the output is clean
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error("AI returned an empty response.");
    }

    const data = JSON.parse(content);
    return NextResponse.json(data);

  } catch (error: any) {
    // This logs the specific error (like a 401 or 404) to your Vercel logs
    console.error("API Error Detailed:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." }, 
      { status: error.status || 500 }
    );
  }
}