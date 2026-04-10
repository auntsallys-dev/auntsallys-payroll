import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true } },
        branch: true,
        department: true,
        position: true,
        shift: true,
        leaveBalances: {
          include: { leaveType: { select: { name: true } } },
        },
        assets: {
          where: { returnedDate: null },
          include: { asset: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Employee GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
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

    // Handle date fields
    if (body.birthDate) body.birthDate = new Date(body.birthDate);
    if (body.dateHired) body.dateHired = new Date(body.dateHired);
    if (body.dateRegularized) body.dateRegularized = new Date(body.dateRegularized);
    if (body.dateResigned) body.dateResigned = new Date(body.dateResigned);

    const employee = await prisma.employee.update({
      where: { id },
      data: body,
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Employee PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
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

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        status: "terminated",
        dateResigned: new Date(),
      },
    });

    // Deactivate the user account
    if (employee.userId) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { isActive: false },
      });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Employee DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to terminate employee" },
      { status: 500 }
    );
  }
}
