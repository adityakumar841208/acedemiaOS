import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import FacultySubject from "@/models/FacultySubject";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole("ADMIN");
    const { id } = await params;
    const body = await req.json();
    const { status, reason } = body;

    await connectToDatabase();

    const facultySubject = await FacultySubject.findOne({
      $or: [
        { id },
        ...(mongoose.isValidObjectId(id) ? [{ _id: new mongoose.Types.ObjectId(id) }] : []),
      ],
    });

    if (!facultySubject) {
      return NextResponse.json(
        { error: "Faculty subject assignment not found." },
        { status: 404 }
      );
    }

    if (status === "REVOKED") {
      facultySubject.status = "REVOKED";
      facultySubject.revokedBy = admin.name;
      facultySubject.revokedAt = new Date();
      facultySubject.revocationReason = reason || "Assignment revoked by Super Admin";
    } else if (status === "ACTIVE") {
      // Check if another active assignment exists for this exact tuple
      const existingActive = await FacultySubject.findOne({
        facultyId: facultySubject.facultyId,
        subjectId: facultySubject.subjectId,
        departmentId: facultySubject.departmentId,
        semesterNumber: facultySubject.semesterNumber,
        status: "ACTIVE",
        _id: { $ne: facultySubject._id },
      });

      if (existingActive) {
        return NextResponse.json(
          { error: "Cannot reactivate: another active assignment already exists for this subject." },
          { status: 409 }
        );
      }

      facultySubject.status = "ACTIVE";
      facultySubject.revokedBy = undefined;
      facultySubject.revokedAt = undefined;
      facultySubject.revocationReason = undefined;
      facultySubject.assignedBy = admin.name;
      facultySubject.assignedAt = new Date();
    } else {
      return NextResponse.json(
        { error: "Invalid status. Must be 'ACTIVE' or 'REVOKED'." },
        { status: 400 }
      );
    }

    await facultySubject.save();

    return NextResponse.json({
      success: true,
      message: `Assignment successfully updated to ${facultySubject.status}.`,
      facultySubject,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to update faculty subject assignment." },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole("ADMIN");
    const { id } = await params;

    await connectToDatabase();

    const facultySubject = await FacultySubject.findOne({
      $or: [
        { id },
        ...(mongoose.isValidObjectId(id) ? [{ _id: new mongoose.Types.ObjectId(id) }] : []),
      ],
    });

    if (!facultySubject) {
      return NextResponse.json(
        { error: "Faculty subject assignment not found." },
        { status: 404 }
      );
    }

    // Soft delete / revoke to preserve historical records
    facultySubject.status = "REVOKED";
    facultySubject.revokedBy = admin.name;
    facultySubject.revokedAt = new Date();
    facultySubject.revocationReason = "Revoked by Super Admin";

    await facultySubject.save();

    return NextResponse.json({
      success: true,
      message: `Successfully revoked teaching assignment for ${facultySubject.subjectName}.`,
      facultySubject,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to revoke faculty subject assignment." },
      { status }
    );
  }
}
