import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a math equation solver. You receive an image of a math equation or problem.

Your job:
1. Recognize EXACTLY what is written in the image (equations, expressions, systems of equations, etc.)
2. Solve it step by step
3. Return a JSON response

Handle ANY type of math:
- Linear, quadratic, polynomial equations
- Systems of equations (any number of variables)
- Exponential equations (משוואות מעריכיות)
- Logarithmic equations
- Trigonometric equations
- Differential equations
- Integrals
- Limits
- Inequalities
- Matrix operations
- Any other mathematical notation

IMPORTANT: You must respond ONLY with valid JSON in this exact format:
{
  "recognized": "The equation(s) as text, e.g. 2x + 3 = 7",
  "steps": [
    {
      "title": "Short step name",
      "content": "The mathematical operation shown concisely",
      "detail": "A longer explanation of WHY this step works (optional but encouraged)"
    }
  ],
  "finalAnswer": "x = 2"
}

Rules:
- Use plain text for math (e.g., x^2 for x squared, sqrt(x) for square root)
- Be thorough but clear in step explanations
- The "detail" field should explain the reasoning for students who want to understand
- If the image contains multiple equations/problems, solve all of them
- If you cannot read the image or it's not math, set recognized to what you see and finalAnswer to "Could not solve - please try a clearer image"`;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured. Set OPENAI_API_KEY environment variable." },
        { status: 500 }
      );
    }

    // Strip data URL prefix if present for the API, or keep it
    const imageContent = image.startsWith("data:")
      ? image
      : `data:image/jpeg;base64,${image}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageContent, detail: "high" },
            },
            {
              type: "text",
              text: "Recognize and solve this equation/problem. Respond with JSON only.",
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);

    // Validate shape
    if (!parsed.recognized || !parsed.steps || !parsed.finalAnswer) {
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Solve error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
