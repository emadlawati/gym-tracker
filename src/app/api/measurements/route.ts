import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const entries = await prisma.bodyMeasurement.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("gym_user_id")?.value || "user_imad";
    const data = await req.json();
    const entry = await prisma.bodyMeasurement.create({
      data: { userId, ...data, date: data.date ? new Date(data.date) : new Date() },
    });
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
