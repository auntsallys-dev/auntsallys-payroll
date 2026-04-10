import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [records, total] = await Promise.all([
      prisma.overtimeRequest.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.overtimeRequest.count({ where }),
    ]);

    return NextResponse.json({
      data: records,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Overtime GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch overtime requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, date, startTime, endTime, totalHours, reason } = body;

    if (!employeeId || !date || !startTime || !endTime || !totalHours) {
      return NextResponse.json(
        { error: "employeeId, date, startTime, endTime, and totalHours are required" },
        { status: 400 }
      );
    }

    const overtime = await prisma.overtimeRequest.create({
      data: {
        employeeId,
        date: new Date(date),
        startTime,
        endTime,
        totalHours,
        reason,
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeId: true },
        },
      },
    });

    return NextResponse.json(overtime, { status: 201 });
  } catch (error) {
    console.error("Overtime POST error:", error);
    return NextResponse.json(
      { error: "Failed to create overtime request" },
      { status: 500 }
    );
  }
}
