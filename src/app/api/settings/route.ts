import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: any = {};
    if (category) where.category = category;

    const settings = await prisma.setting.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Transform to key-value object grouped by category
    const grouped: Record<string, Record<string, string>> = {};
    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = {};
      }
      grouped[setting.category][setting.key] = setting.value;
    }

    return NextResponse.json({ data: settings, grouped });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: "settings array is required with [{key, value, category?}] items" },
        { status: 400 }
      );
    }

    const results = [];

    for (const setting of settings) {
      const { key, value, category } = setting;

      if (!key || value === undefined) {
        continue;
      }

      const result = await prisma.setting.upsert({
        where: { key },
        update: {
          value: String(value),
          category: category || undefined,
        },
        create: {
          key,
          value: String(value),
          category: category || "general",
        },
      });

      results.push(result);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
