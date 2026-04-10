import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const where: any = { year };
    if (employeeId) where.employeeId = employeeId;

    const balances = await prisma.leaveBalance.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeId: true },
        },
        leaveType: {
          select: { id: true, name: true, isPaid: true, defaultDays: true },
        },
      },
      orderBy: [{ employee: { lastName: "asc" } }, { leaveType: { name: "asc" } }],
    });

    return NextResponse.json(balances);
  } catch (error) {
    console.error("Leave balances GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave balances" },
      { status: 500 }
    );
  }
}
