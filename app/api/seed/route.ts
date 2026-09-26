import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const result = store.resetToDefaults();
  return NextResponse.json(result);
}

export async function POST() {
  const result = store.resetToDefaults();
  return NextResponse.json(result);
}

