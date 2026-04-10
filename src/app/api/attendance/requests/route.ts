import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const requests = await prisma.attendanceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Attendance requests GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, date, requestType, requestedTime, reason } = body;

    if (!employeeId || !date || !requestType || !requestedTime || !reason) {
      return NextResponse.json(
        { error: "employeeId, date, requestType, requestedTime, and reason are required" },
        { status: 400 }
      );
    }

    const attendanceRequest = await prisma.attendanceRequest.create({
      data: {
        employeeId,
        date: new Date(date),
        requestType,
        requestedTime: new Date(requestedTime),
        reason,
      },
    });

    return NextResponse.json(attendanceRequest, { status: 201 });
  } catch (error) {
    console.error("Attendance requests POST error:", error);
    return NextResponse.json(
      { error: "Failed to create attendance request" },
      { status: 500 }
    );
  }
}
