import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (status) where.status = status;

    const [payrollRuns, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        include: {
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payrollRun.count({ where }),
    ]);

    return NextResponse.json({
      data: payrollRuns,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Payroll GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll runs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, periodStart, periodEnd, payDate, payFrequency } = body;

    if (!name || !periodStart || !periodEnd || !payDate) {
      return NextResponse.json(
        { error: "name, periodStart, periodEnd, and payDate are required" },
        { status: 400 }
      );
    }

    const payrollRun = await prisma.payrollRun.create({
      data: {
        name,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        payDate: new Date(payDate),
        payFrequency: payFrequency || "semi-monthly",
        status: "draft",
      },
    });

    return NextResponse.json(payrollRun, { status: 201 });
  } catch (error) {
    console.error("Payroll POST error:", error);
    return NextResponse.json(
      { error: "Failed to create payroll run" },
      { status: 500 }
    );
  }
}
