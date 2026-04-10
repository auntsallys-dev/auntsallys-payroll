import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const [records, total] = await Promise.all([
      prisma.officialBusiness.findMany({
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
      prisma.officialBusiness.count({ where }),
    ]);

    return NextResponse.json({
      data: records,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Official business GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch official business requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, date, startTime, endTime, destination, purpose } = body;

    if (!employeeId || !date || !destination || !purpose) {
      return NextResponse.json(
        { error: "employeeId, date, destination, and purpose are required" },
        { status: 400 }
      );
    }

    const ob = await prisma.officialBusiness.create({
      data: {
        employeeId,
        date: new Date(date),
        startTime,
        endTime,
        destination,
        purpose,
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeId: true },
        },
      },
    });

    return NextResponse.json(ob, { status: 201 });
  } catch (error) {
    console.error("Official business POST error:", error);
    return NextResponse.json(
      { error: "Failed to create official business request" },
      { status: 500 }
    );
  }
}
