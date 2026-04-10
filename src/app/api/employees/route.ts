import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch");
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (branch) where.branchId = branch;
    if (department) where.departmentId = department;
    if (status) where.status = status;
    else where.status = { not: "terminated" };

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeId: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          position: { select: { id: true, name: true } },
          shift: { select: { id: true, name: true, startTime: true, endTime: true } },
        },
        orderBy: { lastName: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      data: employees,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Employees GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employeeId,
      firstName,
      lastName,
      middleName,
      email,
      phone,
      gender,
      birthDate,
      civilStatus,
      address,
      city,
      province,
      zipCode,
      branchId,
      departmentId,
      positionId,
      employmentType,
      dateHired,
      basicSalary,
      dailyRate,
      hourlyRate,
      payFrequency,
      sssNumber,
      philhealthNumber,
      pagibigNumber,
      tinNumber,
      bankName,
      bankAccountNumber,
      bankAccountName,
      shiftId,
      role,
    } = body;

    if (!employeeId || !firstName || !lastName || !email || !dateHired) {
      return NextResponse.json(
        { error: "employeeId, firstName, lastName, email, and dateHired are required" },
        { status: 400 }
      );
    }

    // Create user account with default password
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || "employee",
      },
    });

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeId,
        firstName,
        lastName,
        middleName,
        email,
        phone,
        gender,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        civilStatus,
        address,
        city,
        province,
        zipCode,
        branchId,
        departmentId,
        positionId,
        employmentType: employmentType || "regular",
        dateHired: new Date(dateHired),
        basicSalary: basicSalary || 0,
        dailyRate: dailyRate || 0,
        hourlyRate: hourlyRate || 0,
        payFrequency: payFrequency || "semi-monthly",
        sssNumber,
        philhealthNumber,
        pagibigNumber,
        tinNumber,
        bankName,
        bankAccountNumber,
        bankAccountName,
        shiftId,
      },
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error("Employees POST error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Employee ID or email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
