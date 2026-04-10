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

    if (!status || !["approved", "rejected", "cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'approved', 'rejected', or 'cancelled'" },
        { status: 400 }
      );
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    if (leaveRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending leave requests can be updated" },
        { status: 400 }
      );
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedBy,
        approvedAt: status === "approved" ? new Date() : undefined,
      },
    });

    // If approved, deduct from leave balance
    if (status === "approved") {
      const year = new Date(leaveRequest.startDate).getFullYear();

      const balance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
          year,
        },
      });

      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            usedDays: balance.usedDays + leaveRequest.totalDays,
            remainingDays: balance.remainingDays - leaveRequest.totalDays,
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Leave PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update leave request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    // If was approved, restore the balance
    if (leaveRequest.status === "approved") {
      const year = new Date(leaveRequest.startDate).getFullYear();
      const balance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
          year,
        },
      });

      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            usedDays: Math.max(0, balance.usedDays - leaveRequest.totalDays),
            remainingDays: balance.remainingDays + leaveRequest.totalDays,
          },
        });
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Leave DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to cancel leave request" },
      { status: 500 }
    );
  }
}
