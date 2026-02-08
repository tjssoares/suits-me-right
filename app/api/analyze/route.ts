import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { productQuery } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing." }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      // UPDATE THIS LINE: Ensure it ends exactly like this
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });

    const completion = await openai.chat.completions.create({
      model: "gemini-1.5-flash", 
      messages: [
        {
          role: "system",
          content: "You are a Senior Product Consultant. Return JSON only."
        },
        {
          role: "user",
          content: `Analyze: ${productQuery}`
        }
      ],
      // REMOVE response_format if you still get a 404, 
      // some beta endpoints are picky about this
    });

    const data = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Detailed Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}