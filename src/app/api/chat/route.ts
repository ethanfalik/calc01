import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a helpful math tutor assistant inside a calculator app called calc01. The user is looking at a math equation/problem and its solution.

Your job:
- Answer questions about the equation or solution
- Help the user understand the math
- If the user asks to change numbers or variables, provide the corrected equation
- Be concise and friendly

IMPORTANT: If the user asks you to modify the equation (e.g. "change the 7 to a 1", "what if x = 3?", "make it a quadratic"), include a JSON block at the END of your response like this:
\`\`\`json
{"correctedEquation": "the new LaTeX equation here"}
\`\`\`

Only include the JSON block when suggesting a new equation to solve. For explanations or general questions, just respond normally in plain text. Use LaTeX notation wrapped in $ signs for inline math when explaining.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, equation } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const context = equation
      ? `\n\nThe current equation being viewed is: ${equation}`
      : "";

    const chatHistory = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT + context }],
        },
        {
          role: "model",
          parts: [{ text: "Got it! I'm ready to help with math questions." }],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    // Extract corrected equation if present
    let correctedEquation: string | null = null;
    const jsonMatch = text.match(/```json\s*\{[^}]*"correctedEquation"\s*:\s*"([^"]+)"[^}]*\}\s*```/);
    if (jsonMatch) {
      correctedEquation = jsonMatch[1];
    }

    // Clean the response text (remove the JSON block for display)
    const cleanText = text.replace(/```json\s*\{[^}]*"correctedEquation"[^}]*\}\s*```/, "").trim();

    return NextResponse.json({
      content: cleanText,
      correctedEquation,
    });
  } catch (error) {
    console.error("Chat error:", error);
    const raw = error instanceof Error ? error.message : "Internal server error";
    let message = raw;
    if (raw.includes("429") || raw.includes("quota")) {
      message = "Rate limit reached. Please wait a moment.";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
