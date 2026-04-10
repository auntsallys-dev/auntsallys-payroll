import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, approvedBy } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const overtime = await prisma.overtimeRequest.update({
      where: { id },
      data: {
        status,
        approvedBy,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json(overtime);
  } catch (error) {
    console.error("Overtime PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update overtime request" },
      { status: 500 }
    );
  }
}
