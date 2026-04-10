import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, action, location, device, photo } = body;

    if (!employeeId || !action) {
      return NextResponse.json(
        { error: "employeeId and action are required" },
        { status: 400 }
      );
    }

    if (!["clock-in", "clock-out", "break-start", "break-end"].includes(action)) {
      return NextResponse.json(
        { error: "action must be clock-in, clock-out, break-start, or break-end" },
        { status: 400 }
      );
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get employee with shift info
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { shift: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Find existing attendance for today
    let attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: { gte: today, lt: tomorrow },
      },
    });

    if (action === "clock-in") {
      if (attendance?.clockIn) {
        return NextResponse.json(
          { error: "Already clocked in today" },
          { status: 400 }
        );
      }

      // Calculate late minutes based on shift
      let lateMinutes = 0;
      let status = "present";

      if (employee.shift) {
        const [shiftHour, shiftMin] = employee.shift.startTime.split(":").map(Number);
        const shiftStart = new Date(today);
        shiftStart.setHours(shiftHour, shiftMin, 0, 0);

        const gracePeriod = employee.shift.gracePeriod || 15;
        const graceEnd = new Date(shiftStart);
        graceEnd.setMinutes(graceEnd.getMinutes() + gracePeriod);

        if (now > graceEnd) {
          lateMinutes = Math.ceil((now.getTime() - shiftStart.getTime()) / 60000);
          status = "late";
        }
      }

      if (attendance) {
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            clockIn: now,
            status,
            lateMinutes,
            location,
            device,
            photo,
          },
        });
      } else {
        attendance = await prisma.attendance.create({
          data: {
            employeeId,
            date: today,
            shiftId: employee.shiftId,
            clockIn: now,
            status,
            lateMinutes,
            location,
            device,
            photo,
          },
        });
      }
    } else if (action === "clock-out") {
      if (!attendance || !attendance.clockIn) {
        return NextResponse.json(
          { error: "Must clock in before clocking out" },
          { status: 400 }
        );
      }

      if (attendance.clockOut) {
        return NextResponse.json(
          { error: "Already clocked out today" },
          { status: 400 }
        );
      }

      // Calculate undertime, overtime, production hours
      let undertimeMinutes = 0;
      let overtimeMinutes = 0;
      let nightDiffMinutes = 0;

      if (employee.shift) {
        const [endHour, endMin] = employee.shift.endTime.split(":").map(Number);
        const shiftEnd = new Date(today);
        shiftEnd.setHours(endHour, endMin, 0, 0);

        if (now < shiftEnd) {
          undertimeMinutes = Math.ceil(
            (shiftEnd.getTime() - now.getTime()) / 60000
          );
        } else if (now > shiftEnd) {
          overtimeMinutes = Math.ceil(
            (now.getTime() - shiftEnd.getTime()) / 60000
          );
        }

        // Night differential: 10PM to 6AM
        const clockIn = new Date(attendance.clockIn);
        const nightStart = new Date(today);
        nightStart.setHours(22, 0, 0, 0);
        const nightEnd = new Date(tomorrow);
        nightEnd.setHours(6, 0, 0, 0);

        if (now > nightStart) {
          const nightWorkStart = clockIn > nightStart ? clockIn : nightStart;
          const nightWorkEnd = now < nightEnd ? now : nightEnd;
          if (nightWorkEnd > nightWorkStart) {
            nightDiffMinutes = Math.ceil(
              (nightWorkEnd.getTime() - nightWorkStart.getTime()) / 60000
            );
          }
        }
      }

      // Calculate production hours
      const clockInTime = new Date(attendance.clockIn);
      const totalMinutesWorked = Math.ceil(
        (now.getTime() - clockInTime.getTime()) / 60000
      );
      const breakMins = attendance.breakMinutes || (employee.shift?.breakMinutes || 60);
      const productionHours = Math.max(0, (totalMinutesWorked - breakMins) / 60);

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          clockOut: now,
          undertimeMinutes,
          overtimeMinutes,
          nightDiffMinutes,
          productionHours: Math.round(productionHours * 100) / 100,
        },
      });
    } else if (action === "break-start") {
      if (!attendance || !attendance.clockIn) {
        return NextResponse.json(
          { error: "Must clock in before starting break" },
          { status: 400 }
        );
      }

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { breakStart: now },
      });
    } else if (action === "break-end") {
      if (!attendance || !attendance.breakStart) {
        return NextResponse.json(
          { error: "Must start break before ending break" },
          { status: 400 }
        );
      }

      const breakStart = new Date(attendance.breakStart);
      const breakMinutes = Math.ceil(
        (now.getTime() - breakStart.getTime()) / 60000
      );

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          breakEnd: now,
          breakMinutes,
        },
      });
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Clock POST error:", error);
    return NextResponse.json(
      { error: "Failed to process clock action" },
      { status: 500 }
    );
  }
}
