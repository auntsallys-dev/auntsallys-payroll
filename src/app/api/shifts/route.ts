import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    return NextResponse.json(shifts);
  } catch (error) {
    console.error("Shifts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shifts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, startTime, endTime, breakMinutes, gracePeriod, isNightShift } = body;

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Name, start time, and end time are required" },
        { status: 400 }
      );
    }

    const shift = await prisma.shift.create({
      data: {
        name,
        startTime,
        endTime,
        breakMinutes: breakMinutes || 60,
        gracePeriod: gracePeriod || 15,
        isNightShift: isNightShift || false,
      },
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error: any) {
    console.error("Shifts POST error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Shift name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create shift" },
      { status: 500 }
    );
  }
}
