import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { productQuery } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });

    const completion = await openai.chat.completions.create({
      model: "gemini-1.5-flash",
      messages: [
        { role: "system", content: "You are a product expert. Return JSON." },
        { role: "user", content: productQuery }
      ],
      response_format: { type: "json_object" },
    });

    return NextResponse.json(JSON.parse(completion.choices[0].message.content || "{}"));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}