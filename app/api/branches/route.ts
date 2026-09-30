import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Branch from "@/models/Branch";

export async function GET() {
  try {
    await connectToDatabase();
    const branches = await Branch.find({
      $or: [{ status: "ACTIVE" }, { isActive: true }],
    })
      .sort({ code: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      branches: branches.map((b: any) => ({
        _id: b._id.toString(),
        name: b.name,
        code: b.code,
        status: b.status,
        isActive: b.isActive,
        hodName: b.hodName,
        description: b.description,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load branches" },
      { status: 500 }
    );
  }
}
