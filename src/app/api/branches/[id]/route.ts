import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        employees: {
          where: { status: "active" },
          include: {
            department: { select: { name: true } },
            position: { select: { name: true } },
          },
        },
      },
    });

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    return NextResponse.json(branch);
  } catch (error) {
    console.error("Branch GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch branch" },
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

    const branch = await prisma.branch.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error("Branch PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update branch" },
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

    const branch = await prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error("Branch DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete branch" },
      { status: 500 }
    );
  }
}
