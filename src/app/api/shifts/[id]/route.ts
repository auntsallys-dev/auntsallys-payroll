import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        _count: { select: { employees: true } },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Shift GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shift" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const shift = await prisma.shift.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(shift);
  } catch (error: any) {
    console.error("Shift PUT error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Shift name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update shift" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const shift = await prisma.shift.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Shift DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete shift" },
      { status: 500 }
    );
  }
}
