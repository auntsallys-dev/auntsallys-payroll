import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computePayroll } from "@/lib/payroll-ph";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the payroll run
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id },
    });

    if (!payrollRun) {
      return NextResponse.json(
        { error: "Payroll run not found" },
        { status: 404 }
      );
    }

    if (payrollRun.status !== "draft" && payrollRun.status !== "processing") {
      return NextResponse.json(
        { error: "Payroll run must be in draft or processing status" },
        { status: 400 }
      );
    }

    // Update status to processing
    await prisma.payrollRun.update({
      where: { id },
      data: { status: "processing" },
    });

    // Delete existing payroll items for this run (reprocessing)
    await prisma.payrollItem.deleteMany({
      where: { payrollRunId: id },
    });

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: { status: "active" },
      include: { shift: true },
    });

    const periodStart = new Date(payrollRun.periodStart);
    const periodEnd = new Date(payrollRun.periodEnd);
    periodEnd.setHours(23, 59, 59, 999);

    // Calculate total working days in the period (exclude weekends)
    let totalWorkingDays = 0;
    const tempDate = new Date(periodStart);
    while (tempDate <= periodEnd) {
      const dayOfWeek = tempDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalWorkingDays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Get holidays in the period
    const holidays = await prisma.holiday.findMany({
      where: {
        date: { gte: periodStart, lte: periodEnd },
      },
    });

    const regularHolidayDates = holidays
      .filter((h) => h.type === "regular")
      .map((h) => new Date(h.date).toDateString());
    const specialHolidayDates = holidays
      .filter((h) => h.type === "special-non-working" || h.type === "special-working")
      .map((h) => new Date(h.date).toDateString());

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;
    const payrollItems = [];

    for (const employee of employees) {
      // Get attendance records for this employee in the period
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          date: { gte: periodStart, lte: periodEnd },
        },
      });

      // Calculate attendance-based metrics
      let daysWorked = 0;
      let totalLateMinutes = 0;
      let totalUndertimeMinutes = 0;
      let totalOvertimeMinutes = 0;
      let totalNightDiffMinutes = 0;
      let totalProductionHours = 0;
      let absentDays = 0;
      let holidayDaysWorked = 0;
      let specialHolidayDaysWorked = 0;

      const attendanceDateSet = new Set(
        attendanceRecords.map((a) => new Date(a.date).toDateString())
      );

      // Count working days with no attendance as absent
      const checkDate = new Date(periodStart);
      while (checkDate <= periodEnd) {
        const dayOfWeek = checkDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const dateStr = checkDate.toDateString();
          const isHoliday =
            regularHolidayDates.includes(dateStr) ||
            specialHolidayDates.includes(dateStr);

          if (!attendanceDateSet.has(dateStr) && !isHoliday) {
            absentDays++;
          }
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }

      for (const record of attendanceRecords) {
        if (
          record.status === "present" ||
          record.status === "late" ||
          record.status === "half-day"
        ) {
          daysWorked += record.status === "half-day" ? 0.5 : 1;
        }

        totalLateMinutes += record.lateMinutes;
        totalUndertimeMinutes += record.undertimeMinutes;
        totalOvertimeMinutes += record.overtimeMinutes;
        totalNightDiffMinutes += record.nightDiffMinutes;
        totalProductionHours += record.productionHours;

        const dateStr = new Date(record.date).toDateString();
        if (regularHolidayDates.includes(dateStr) && record.clockIn) {
          holidayDaysWorked++;
        }
        if (specialHolidayDates.includes(dateStr) && record.clockIn) {
          specialHolidayDaysWorked++;
        }
      }

      // Also get approved overtime requests for the period
      const approvedOT = await prisma.overtimeRequest.findMany({
        where: {
          employeeId: employee.id,
          date: { gte: periodStart, lte: periodEnd },
          status: "approved",
        },
      });

      const approvedOTHours = approvedOT.reduce(
        (sum, ot) => sum + ot.totalHours,
        0
      );

      // Use the greater of actual OT minutes or approved OT hours
      const overtimeHours = Math.max(
        totalOvertimeMinutes / 60,
        approvedOTHours
      );

      const computation = computePayroll({
        basicSalary: employee.basicSalary,
        daysWorked,
        totalWorkingDays,
        overtimeHours,
        nightDiffHours: totalNightDiffMinutes / 60,
        holidayDays: holidayDaysWorked,
        specialHolidayDays: specialHolidayDaysWorked,
        lateMinutes: totalLateMinutes,
        undertimeMinutes: totalUndertimeMinutes,
        absentDays,
        allowances: 0,
        otherDeductions: 0,
        payFrequency: employee.payFrequency as
          | "monthly"
          | "semi-monthly"
          | "weekly",
      });

      const lateDeductions =
        totalLateMinutes * (employee.basicSalary / 22 / 8 / 60);
      const undertimeDeductions =
        totalUndertimeMinutes * (employee.basicSalary / 22 / 8 / 60);
      const absentDeductions = absentDays * (employee.basicSalary / 22);

      payrollItems.push({
        payrollRunId: id,
        employeeId: employee.id,
        basicPay: computation.basicPay,
        overtimePay: computation.overtimePay,
        nightDiffPay: computation.nightDiffPay,
        holidayPay: computation.holidayPay,
        allowances: computation.allowances,
        grossPay: computation.grossPay,
        sssContribution: computation.sssEmployee,
        philhealthContribution: computation.philhealthEmployee,
        pagibigContribution: computation.pagibigEmployee,
        withholdingTax: computation.withholdingTax,
        lateDeductions: Math.round(lateDeductions * 100) / 100,
        undertimeDeductions: Math.round(undertimeDeductions * 100) / 100,
        absentDeductions: Math.round(absentDeductions * 100) / 100,
        totalDeductions: computation.totalDeductions,
        netPay: computation.netPay,
        daysWorked,
        hoursWorked: totalProductionHours,
      });

      totalGross += computation.grossPay;
      totalDeductions += computation.totalDeductions;
      totalNetPay += computation.netPay;
    }

    // Batch create all payroll items
    if (payrollItems.length > 0) {
      await prisma.payrollItem.createMany({
        data: payrollItems,
      });
    }

    // Update payroll run totals
    const updatedPayrollRun = await prisma.payrollRun.update({
      where: { id },
      data: {
        status: "processing",
        totalGross: Math.round(totalGross * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalNetPay: Math.round(totalNetPay * 100) / 100,
        employeeCount: employees.length,
      },
      include: {
        items: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedPayrollRun);
  } catch (error) {
    console.error("Payroll process error:", error);
    return NextResponse.json(
      { error: "Failed to process payroll" },
      { status: 500 }
    );
  }
}
