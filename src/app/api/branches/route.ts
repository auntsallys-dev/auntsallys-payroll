import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error("Branches GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, phone, email, address, city, province, zipCode, logo } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Branch name is required" },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        type: type || "sub",
        phone,
        email,
        address,
        city,
        province,
        zipCode,
        logo,
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("Branches POST error:", error);
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 500 }
    );
  }
}
