import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured. Set GEMINI_API_KEY environment variable." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Extract base64 data and mime type from data URL
    const match = image.match(/^data:(.+?);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }

    const [, mimeType, base64Data] = match;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT + "\n\nRecognize and solve this equation/problem. Respond with JSON only." },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
      },
    });

    const content = result.response.text();
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);

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
