import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                department: { select: { name: true } },
                branch: { select: { name: true } },
                bankName: true,
                bankAccountNumber: true,
                bankAccountName: true,
              },
            },
          },
          orderBy: { employee: { lastName: "asc" } },
        },
      },
    });

    if (!payrollRun) {
      return NextResponse.json(
        { error: "Payroll run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(payrollRun);
  } catch (error) {
    console.error("Payroll run GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll run" },
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
    const { status, approvedBy, notes } = body;

    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
    });

    if (!payrollRun) {
      return NextResponse.json(
        { error: "Payroll run not found" },
        { status: 404 }
      );
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      draft: ["processing", "cancelled"],
      processing: ["approved", "draft", "cancelled"],
      approved: ["paid", "cancelled"],
      paid: [],
      cancelled: ["draft"],
    };

    if (
      status &&
      !validTransitions[payrollRun.status]?.includes(status)
    ) {
      return NextResponse.json(
        {
          error: `Cannot transition from '${payrollRun.status}' to '${status}'`,
        },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    if (status === "approved") {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }

    const updated = await prisma.payrollRun.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Payroll run PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update payroll run" },
      { status: 500 }
    );
  }
}
