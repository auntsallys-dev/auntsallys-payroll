import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, employeeId, notes } = body;

    if (!assetId || !employeeId) {
      return NextResponse.json(
        { error: "assetId and employeeId are required" },
        { status: 400 }
      );
    }

    // Check if asset is available
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.status !== "available") {
      return NextResponse.json(
        { error: "Asset is not available for assignment" },
        { status: 400 }
      );
    }

    // Create assignment and update asset status
    const [assignment] = await Promise.all([
      prisma.assetAssignment.create({
        data: {
          assetId,
          employeeId,
          assignedDate: new Date(),
          notes,
        },
        include: {
          asset: true,
          employee: {
            select: { firstName: true, lastName: true, employeeId: true },
          },
        },
      }),
      prisma.asset.update({
        where: { id: assetId },
        data: { status: "assigned" },
      }),
    ]);

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Asset assign POST error:", error);
    return NextResponse.json(
      { error: "Failed to assign asset" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, condition, notes } = body;

    if (!assetId) {
      return NextResponse.json(
        { error: "assetId is required" },
        { status: 400 }
      );
    }

    // Find the active assignment
    const assignment = await prisma.assetAssignment.findFirst({
      where: {
        assetId,
        returnedDate: null,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "No active assignment found for this asset" },
        { status: 404 }
      );
    }

    // Return the asset
    const [updatedAssignment] = await Promise.all([
      prisma.assetAssignment.update({
        where: { id: assignment.id },
        data: {
          returnedDate: new Date(),
          condition,
          notes,
        },
        include: {
          asset: true,
          employee: {
            select: { firstName: true, lastName: true, employeeId: true },
          },
        },
      }),
      prisma.asset.update({
        where: { id: assetId },
        data: {
          status: "available",
          condition: condition || undefined,
        },
      }),
    ]);

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("Asset return PUT error:", error);
    return NextResponse.json(
      { error: "Failed to return asset" },
      { status: 500 }
    );
  }
}
