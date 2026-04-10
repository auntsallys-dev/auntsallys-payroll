import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total active employees
    const totalEmployees = await prisma.employee.count({
      where: { status: "active" },
    });

    // Present today
    const presentToday = await prisma.attendance.count({
      where: {
        date: { gte: today, lt: tomorrow },
        status: { in: ["present", "late", "half-day"] },
      },
    });

    // Late arrivals today
    const lateArrivals = await prisma.attendance.count({
      where: {
        date: { gte: today, lt: tomorrow },
        status: "late",
      },
    });

    // On leave today
    const onLeave = await prisma.leaveRequest.count({
      where: {
        status: "approved",
        startDate: { lte: tomorrow },
        endDate: { gte: today },
      },
    });

    // Recent attendance (last 10)
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            avatar: true,
          },
        },
      },
      orderBy: { clockIn: "desc" },
      take: 10,
    });

    // Upcoming birthdays (next 30 days)
    const employees = await prisma.employee.findMany({
      where: { status: "active", birthDate: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        birthDate: true,
        avatar: true,
        department: { select: { name: true } },
      },
    });

    const now = new Date();
    const upcomingBirthdays = employees
      .filter((emp) => {
        if (!emp.birthDate) return false;
        const bd = new Date(emp.birthDate);
        const thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        if (thisYearBd < now) {
          thisYearBd.setFullYear(thisYearBd.getFullYear() + 1);
        }
        const diffDays = Math.ceil(
          (thisYearBd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays >= 0 && diffDays <= 30;
      })
      .sort((a, b) => {
        const bdA = new Date(a.birthDate!);
        const bdB = new Date(b.birthDate!);
        const thisYearA = new Date(now.getFullYear(), bdA.getMonth(), bdA.getDate());
        const thisYearB = new Date(now.getFullYear(), bdB.getMonth(), bdB.getDate());
        if (thisYearA < now) thisYearA.setFullYear(thisYearA.getFullYear() + 1);
        if (thisYearB < now) thisYearB.setFullYear(thisYearB.getFullYear() + 1);
        return thisYearA.getTime() - thisYearB.getTime();
      })
      .slice(0, 5);

    return NextResponse.json({
      totalEmployees,
      presentToday,
      lateArrivals,
      onLeave,
      recentAttendance,
      upcomingBirthdays,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
