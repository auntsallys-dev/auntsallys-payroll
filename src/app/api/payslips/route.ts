import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const payrollRunId = searchParams.get("payrollRunId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (payrollRunId) where.payrollRunId = payrollRunId;
    if (search) {
      where.employee = {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { employeeId: { contains: search } },
        ],
      };
    }

    const [payslips, total] = await Promise.all([
      prisma.payrollItem.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              department: { select: { name: true } },
              branch: { select: { name: true } },
              position: { select: { name: true } },
              basicSalary: true,
              bankName: true,
              bankAccountNumber: true,
              bankAccountName: true,
              sssNumber: true,
              philhealthNumber: true,
              pagibigNumber: true,
              tinNumber: true,
            },
          },
          payrollRun: {
            select: {
              id: true,
              name: true,
              periodStart: true,
              periodEnd: true,
              payDate: true,
              payFrequency: true,
              status: true,
            },
          },
        },
        orderBy: { payrollRun: { payDate: "desc" } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payrollItem.count({ where }),
    ]);

    return NextResponse.json({
      data: payslips,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Payslips GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payslips" },
      { status: 500 }
    );
  }
}
