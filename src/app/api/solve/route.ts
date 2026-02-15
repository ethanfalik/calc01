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
  "recognized": "LaTeX string of the equation(s), e.g. 2x + 3 = 7",
  "steps": [
    {
      "title": "Short step name",
      "content": "The mathematical operation as a LaTeX string",
      "detail": "A plain text explanation of WHY this step works"
    }
  ],
  "finalAnswer": "LaTeX string, e.g. x = 2"
}

Rules:
- Use LaTeX notation for ALL math in "recognized", "content", and "finalAnswer" fields. Examples: x^{2} for x squared, \\sqrt{x} for square root, \\frac{a}{b} for fractions, \\int, \\sum, \\lim, etc.
- The "detail" field should be plain text (no LaTeX) explaining the reasoning simply
- Be thorough but clear in step explanations
- If the image contains multiple equations/problems, solve all of them
- IMPORTANT for handwriting recognition: The writer's 1s and 7s look very similar. The ONLY way to distinguish them is that 7s have a small horizontal line/cross through the vertical stroke, and 1s do not. If a digit has a cross stroke, it is a 7. If it has no cross stroke, it is a 1.
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

    // Extract base64 data and mime type from data URL
    const match = image.match(/^data:(.+?);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }

    const [, mimeType, base64Data] = match;

    const models = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];
    let content: string | undefined;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
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
        content = result.response.text();
        if (content) break;
      } catch (e) {
        // If last model also fails, rethrow
        if (modelName === models[models.length - 1]) throw e;
      }
    }
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
    const raw = error instanceof Error ? error.message : "Internal server error";
    let message = raw;
    if (raw.includes("429") || raw.includes("quota")) {
      message = "Rate limit reached. Please wait a moment and try again.";
    } else if (raw.includes("API_KEY") || raw.includes("403")) {
      message = "Invalid API key. Check your GEMINI_API_KEY configuration.";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
