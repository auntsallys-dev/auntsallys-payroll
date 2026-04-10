import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const view = searchParams.get("view");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (employeeId && view !== "admin") {
      where.employeeId = employeeId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (status) where.status = status;

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              avatar: true,
              department: { select: { name: true } },
            },
          },
          shift: {
            select: { name: true, startTime: true, endTime: true },
          },
        },
        orderBy: [{ date: "desc" }, { clockIn: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({
      data: records,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, date, status, clockIn, clockOut, remarks, isManualEntry } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId is required" },
        { status: 400 }
      );
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Find the employee's shift
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { shiftId: true },
    });

    // Check for existing attendance record for this date
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: { gte: attendanceDate, lt: nextDay },
      },
    });

    if (existing) {
      // Update existing record
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: status || existing.status,
          clockIn: clockIn ? new Date(clockIn) : existing.clockIn,
          clockOut: clockOut ? new Date(clockOut) : existing.clockOut,
          remarks: remarks || existing.remarks,
          isManualEntry: isManualEntry ?? existing.isManualEntry,
        },
      });
      return NextResponse.json(updated);
    }

    // Create new record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: attendanceDate,
        shiftId: employee?.shiftId,
        status: status || "present",
        clockIn: clockIn ? new Date(clockIn) : undefined,
        clockOut: clockOut ? new Date(clockOut) : undefined,
        remarks,
        isManualEntry: isManualEntry ?? false,
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json(
      { error: "Failed to create attendance record" },
      { status: 500 }
    );
  }
}
