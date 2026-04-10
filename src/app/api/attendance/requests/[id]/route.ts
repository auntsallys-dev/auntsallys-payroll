import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, approvedBy } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const attendanceRequest = await prisma.attendanceRequest.update({
      where: { id },
      data: {
        status,
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // If approved, update the actual attendance record
    if (status === "approved") {
      const reqDate = new Date(attendanceRequest.date);
      reqDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(reqDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const existing = await prisma.attendance.findFirst({
        where: {
          employeeId: attendanceRequest.employeeId,
          date: { gte: reqDate, lt: nextDay },
        },
      });

      const updateData: any = {};
      if (attendanceRequest.requestType === "clock-in") {
        updateData.clockIn = attendanceRequest.requestedTime;
      } else if (attendanceRequest.requestType === "clock-out") {
        updateData.clockOut = attendanceRequest.requestedTime;
      } else if (attendanceRequest.requestType === "correction") {
        updateData.clockIn = attendanceRequest.requestedTime;
      }
      updateData.isManualEntry = true;
      updateData.approvedBy = approvedBy;

      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: updateData,
        });
      } else {
        await prisma.attendance.create({
          data: {
            employeeId: attendanceRequest.employeeId,
            date: reqDate,
            ...updateData,
            status: "present",
          },
        });
      }
    }

    return NextResponse.json(attendanceRequest);
  } catch (error) {
    console.error("Attendance request PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update attendance request" },
      { status: 500 }
    );
  }
}
