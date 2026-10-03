import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runAIAssistant } from "@/lib/ai/assistant";

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Authentication & Derive Identity Solely from Session
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to use the AI Assistant." },
        { status: 401 }
      );
    }

    // 2. Parse and Validate Request Body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { message, history } = body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message content is required." },
        { status: 400 }
      );
    }

    if (message.length > 600) {
      return NextResponse.json(
        { error: "Message exceeds 600 characters limit." },
        { status: 400 }
      );
    }

    // 3. Run AI Assistant with Server-Derived User Context
    const result = await runAIAssistant({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      user,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    console.error("[API /api/ai/assistant] Error handling assistant request:", err);
    return NextResponse.json(
      { error: "Failed to process request with AI Assistant." },
      { status: 500 }
    );
  }
}
