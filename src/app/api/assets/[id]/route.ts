import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                department: { select: { name: true } },
              },
            },
          },
          orderBy: { assignedDate: "desc" },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Asset GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset" },
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

    if (body.purchaseDate) body.purchaseDate = new Date(body.purchaseDate);

    const asset = await prisma.asset.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Asset PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update asset" },
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

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        status: "disposed",
        condition: "disposed",
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Asset DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to dispose asset" },
      { status: 500 }
    );
  }
}
