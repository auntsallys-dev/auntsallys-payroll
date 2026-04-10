import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(leaveTypes);
  } catch (error) {
    console.error("Leave types GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave types" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, defaultDays, isPaid, requiresApproval } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        name,
        defaultDays: defaultDays ?? 0,
        isPaid: isPaid ?? true,
        requiresApproval: requiresApproval ?? true,
      },
    });

    return NextResponse.json(leaveType, { status: 201 });
  } catch (error: any) {
    console.error("Leave types POST error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Leave type name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create leave type" },
      { status: 500 }
    );
  }
}
