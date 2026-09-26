import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import connectToDatabase from "@/lib/db";
import Resource from "@/models/Resource";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let updated = store.incrementDownload(id);
  try {
    await connectToDatabase();
    const databaseResource = await Resource.findOneAndUpdate(
      { id },
      { $inc: { downloadCount: 1 } },
      { new: true }
    ).lean();
    if (databaseResource) updated = databaseResource as any;
  } catch (error) {
    console.error("Resource download count database update failed; using local fallback.", error);
  }
  if (!updated) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, downloadCount: updated.downloadCount });
}

